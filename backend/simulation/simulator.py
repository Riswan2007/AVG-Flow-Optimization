import time
import uuid
import asyncio
import datetime
from typing import Dict, List, Optional
from backend.models.schemas import (
    AGV, Task, AGVStatus, TaskStatus, SimulationState, SimulationMetrics, ActivityLog
)
from backend.optimization.graph_engine import FactoryGraphEngine
from backend.optimization.assignment_engine import AGVAssignmentEngine
from backend.database.db import Database

class SimulatorEngine:
    def __init__(self, db: Database, graph_engine: FactoryGraphEngine, assignment_engine: AGVAssignmentEngine):
        self.db = db
        self.graph_engine = graph_engine
        self.assignment_engine = assignment_engine

        self.is_running = False
        self.speed = 1.0  # 1.0x, 2.0x, 5.0x, 10.0x
        self.sim_time = 0.0  # seconds
        self.last_optimization_time = datetime.datetime.now().strftime("%H:%M:%S")
        self.last_opt_result = None

        # Simulation metrics counters
        self.total_reassignments = 0
        self.total_rerouted = 0
        self.completed_task_times: List[float] = []
        self.completed_task_distances: List[float] = []

    def start(self):
        self.is_running = True

    def pause(self):
        self.is_running = False

    def set_speed(self, speed: float):
        self.speed = max(0.5, min(20.0, speed))

    def reset(self):
        self.is_running = False
        self.sim_time = 0.0
        self.speed = 1.0
        self.total_reassignments = 0
        self.total_rerouted = 0
        self.completed_task_times.clear()
        self.completed_task_distances.clear()
        self.graph_engine.setup_default_factory()
        self.db.reset_database()
        self.run_optimization("System Reset")

    def run_optimization(self, reason: str):
        """Runs the backend dynamic optimization engine and syncs state to SQLite DB."""
        agvs = self.db.get_all_agvs()
        tasks = self.db.get_all_tasks()

        opt_result, diffs, logs = self.assignment_engine.optimize(agvs, tasks, reason)
        self.last_opt_result = opt_result
        self.last_optimization_time = datetime.datetime.now().strftime("%H:%M:%S")

        # Save updated AGVs and Tasks back to DB
        for agv in agvs:
            self.db.update_agv(agv)
        for task in tasks:
            self.db.update_task(task)
        
        # Save diffs and logs
        for diff in diffs:
            self.db.add_optimization_diff(diff)
            self.total_reassignments += 1
        for log in logs:
            self.db.add_activity_log(log)

        return opt_result

    def tick(self, dt_seconds: float = 1.0):
        """Advances simulation by dt_seconds * speed."""
        if not self.is_running:
            return

        effective_dt = dt_seconds * self.speed
        self.sim_time += effective_dt

        agvs = self.db.get_all_agvs()
        tasks = self.db.get_all_tasks()
        task_map = {t.id: t for t in tasks}

        state_changed = False

        for agv in agvs:
            if agv.status == AGVStatus.BUSY and agv.current_route and len(agv.current_route) >= 2:
                # Move AGV along current route
                route = agv.current_route
                curr_node_idx = agv.route_index
                if curr_node_idx >= len(route) - 1:
                    continue

                u_id = route[curr_node_idx]
                v_id = route[curr_node_idx + 1]

                edge = self.graph_engine.get_edge(u_id, v_id)
                dist = edge.distance if edge else 30.0
                # Enhanced AGV speed multiplier for snappy 3D material movement
                travel_sec = dist / max(0.1, agv.speed * 2.5)

                # Progress delta
                progress_inc = effective_dt / travel_sec
                agv.sub_progress += progress_inc

                # Battery drain during movement
                drain = (dist * progress_inc) * AGVAssignmentEngine.BATTERY_PER_METER
                agv.battery = max(0.0, agv.battery - drain)

                # If battery dropped below safety buffer while moving, trigger battery alert/re-opt
                if agv.battery < 15.0 and agv.status != AGVStatus.CHARGING:
                    now_str = datetime.datetime.now().strftime("%H:%M:%S")
                    self.db.add_activity_log(ActivityLog(
                        id=f"LOG-{uuid.uuid4().hex[:10]}",
                        timestamp=now_str,
                        level="warning",
                        event_type="battery",
                        message=f"CRITICAL BATTERY ALERT: {agv.id} battery fell to {agv.battery:.1f}%.",
                        details={"agv_id": agv.id, "battery": agv.battery}
                    ))

                # Node arrival check
                if agv.sub_progress >= 1.0:
                    agv.sub_progress = 0.0
                    agv.route_index += 1
                    agv.location = v_id

                    # Check if reached final route node (Destination)
                    if agv.route_index >= len(route) - 1:
                        if agv.current_task and agv.current_task in task_map:
                            t_obj = task_map[agv.current_task]
                            t_obj.status = TaskStatus.COMPLETED
                            self.db.update_task(t_obj)
                            
                            # Metrics logging
                            pickup_d, deliv_d, _ = self.graph_engine.get_route_metrics(route)
                            self.completed_task_distances.append(pickup_d)
                            self.completed_task_times.append(deliv_d)

                            now_str = datetime.datetime.now().strftime("%H:%M:%S")
                            self.db.add_activity_log(ActivityLog(
                                id=f"LOG-{uuid.uuid4().hex[:10]}",
                                timestamp=now_str,
                                level="success",
                                event_type="assignment",
                                message=f"TASK COMPLETED: {t_obj.id} transported by {agv.id} to {t_obj.destination}.",
                                details={"task_id": t_obj.id, "agv_id": agv.id}
                            ))

                        agv.status = AGVStatus.AVAILABLE
                        agv.current_task = None
                        agv.current_route = []
                        agv.route_index = 0
                        agv.estimated_completion_time = 0.0
                        state_changed = True

                self.db.update_agv(agv)

            elif agv.status == AGVStatus.CHARGING:
                # Recharge battery slowly
                agv.battery = min(100.0, agv.battery + 2.0 * effective_dt)
                if agv.battery >= 95.0:
                    agv.status = AGVStatus.AVAILABLE
                    now_str = datetime.datetime.now().strftime("%H:%M:%S")
                    self.db.add_activity_log(ActivityLog(
                        id=f"LOG-CHARGE-{time.time()}",
                        timestamp=now_str,
                        level="info",
                        event_type="battery",
                        message=f"{agv.id} finished charging ({agv.battery:.0f}%). Now AVAILABLE.",
                        details={"agv_id": agv.id}
                    ))
                    state_changed = True
                self.db.update_agv(agv)

        if state_changed:
            self.run_optimization("Task Completion / AGV State Shift")

    def get_simulation_state(self) -> SimulationState:
        return SimulationState(
            is_running=self.is_running,
            speed=self.speed,
            sim_time=round(self.sim_time, 1),
            status="Running" if self.is_running else "Paused"
        )

    def get_metrics(self) -> SimulationMetrics:
        tasks = self.db.get_all_tasks()
        agvs = self.db.get_all_agvs()

        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
        pending = sum(1 for t in tasks if t.status == TaskStatus.PENDING)
        active = sum(1 for t in tasks if t.status in [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS])

        avg_dist = round(sum(self.completed_task_distances) / max(1, len(self.completed_task_distances)), 1)
        avg_time = round(sum(self.completed_task_times) / max(1, len(self.completed_task_times)), 1)

        utilization = {}
        for a in agvs:
            utilization[a.id] = 100.0 if a.status == AGVStatus.BUSY else (50.0 if a.status == AGVStatus.CHARGING else 0.0)

        avg_batt = round(sum(a.battery for a in agvs) / max(1, len(agvs)), 1)

        return SimulationMetrics(
            total_tasks=total,
            completed_tasks=completed,
            pending_tasks=pending,
            active_tasks=active,
            average_travel_distance=avg_dist,
            average_completion_time=avg_time,
            agv_utilization=utilization,
            dynamic_reassignments=self.total_reassignments,
            rerouted_tasks=self.total_rerouted,
            average_battery=avg_batt
        )
