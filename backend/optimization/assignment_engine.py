from typing import List, Dict, Tuple, Optional
import datetime
import time
import uuid
from backend.models.schemas import (
    AGV, Task, AGVStatus, TaskPriority, TaskStatus, CandidateScore,
    TaskAssignmentDetail, OptimizationResult, BeforeAfterDiff, ActivityLog
)
from backend.optimization.graph_engine import FactoryGraphEngine

class AGVAssignmentEngine:
    # Energy consumption model: ~0.15% battery per meter traveled
    BATTERY_PER_METER = 0.15
    BATTERY_SAFETY_BUFFER = 15.0  # Minimum required battery buffer after task completion (%)
    STABILITY_THRESHOLD = 15.0   # Score advantage required to switch an active task AGV assignment

    def __init__(self, graph_engine: FactoryGraphEngine):
        self.graph_engine = graph_engine

    def evaluate_agv_for_task(self, agv: AGV, task: Task) -> CandidateScore:
        """
        Evaluates a single AGV against a given Task.
        Checks hard constraints first, then computes 5-factor normalized score.
        """
        # 1. Hard Constraint: Availability Check
        if agv.status in [AGVStatus.OFFLINE, AGVStatus.CHARGING]:
            return CandidateScore(
                agv_id=agv.id,
                agv_name=agv.name,
                eligible=False,
                rejection_reason=f"AGV is currently {agv.status.value.upper()}"
            )

        # 2. Hard Constraint: Capacity Check
        if agv.capacity < task.quantity:
            return CandidateScore(
                agv_id=agv.id,
                agv_name=agv.name,
                eligible=False,
                rejection_reason=f"Insufficient Capacity ({agv.capacity:.0f}kg < required {task.quantity:.0f}kg)"
            )

        # 3. Hard Constraint: Route Feasibility (Pickup Path + Delivery Path)
        pickup_path, pickup_dist, pickup_time, pickup_cost = self.graph_engine.find_optimal_route(agv.location, task.source)
        delivery_path, delivery_dist, delivery_time, delivery_cost = self.graph_engine.find_optimal_route(task.source, task.destination)

        if pickup_path is None or delivery_path is None:
            return CandidateScore(
                agv_id=agv.id,
                agv_name=agv.name,
                eligible=False,
                rejection_reason="Route Blocked / No Feasible Path Available"
            )

        total_dist = pickup_dist + delivery_dist
        total_time = pickup_time + delivery_time

        # 4. Hard Constraint: Battery Suitability (Pickup + Delivery + Buffer)
        estimated_battery_needed = total_dist * self.BATTERY_PER_METER
        battery_after_task = agv.battery - estimated_battery_needed

        if battery_after_task < self.BATTERY_SAFETY_BUFFER:
            return CandidateScore(
                agv_id=agv.id,
                agv_name=agv.name,
                eligible=False,
                rejection_reason=f"Insufficient Battery (Needs {estimated_battery_needed:.1f}%, Leftover: {battery_after_task:.1f}% < {self.BATTERY_SAFETY_BUFFER:.0f}% buffer)",
                distance_to_source=pickup_dist,
                task_route_distance=delivery_dist,
                total_distance=total_dist,
                estimated_time=total_time,
                battery_after_task=max(0.0, battery_after_task)
            )

        # Calculate combined route congestion
        full_path = pickup_path[:-1] + delivery_path
        _, _, avg_congestion = self.graph_engine.get_route_metrics(full_path)

        # -------------------------------------------------------------
        # 5-Factor Transparent Normalized Scoring Formula (0 - 100 each)
        # -------------------------------------------------------------
        
        # Factor 1: Distance Efficiency (30%) - Normalized against 250m max distance threshold
        score_dist = max(0.0, min(100.0, 100.0 - (total_dist / 250.0) * 100.0))

        # Factor 2: Battery Suitability (25%) - Direct battery percentage
        score_batt = max(0.0, min(100.0, agv.battery))

        # Factor 3: Route Quality (20%) - Inversely proportional to congestion
        score_route = max(0.0, min(100.0, (1.0 - avg_congestion) * 100.0))

        # Factor 4: Task Priority (15%)
        prio_scores = {
            TaskPriority.NORMAL: 50.0,
            TaskPriority.HIGH: 80.0,
            TaskPriority.URGENT: 100.0
        }
        score_prio = prio_scores.get(task.priority, 50.0)

        # Factor 5: AGV Availability (10%)
        score_avail = 100.0 if agv.status == AGVStatus.AVAILABLE else 40.0

        # Weighted Total Score Formula
        total_score = (
            0.30 * score_dist +
            0.25 * score_batt +
            0.20 * score_route +
            0.15 * score_prio +
            0.10 * score_avail
        )

        return CandidateScore(
            agv_id=agv.id,
            agv_name=agv.name,
            eligible=True,
            distance_to_source=pickup_dist,
            task_route_distance=delivery_dist,
            total_distance=total_dist,
            estimated_time=total_time,
            battery_after_task=round(battery_after_task, 1),
            score_distance=round(score_dist, 1),
            score_battery=round(score_batt, 1),
            score_route=round(score_route, 1),
            score_priority=round(score_prio, 1),
            score_availability=round(score_avail, 1),
            total_score=round(total_score, 1)
        )

    def optimize(self, agvs: List[AGV], tasks: List[Task], trigger_reason: str) -> Tuple[OptimizationResult, List[BeforeAfterDiff], List[ActivityLog]]:
        """
        Main Optimization Core:
        1. Sort pending/active tasks by priority (URGENT > HIGH > NORMAL).
        2. Evaluate all AGV candidates per task.
        3. Match best AGVs using transparent scoring formula.
        4. Apply hysteresis logic to prevent jittery reassignments.
        5. Generate Before-vs-After diffs and Activity Log entries.
        """
        now_str = datetime.datetime.now().strftime("%H:%M:%S")
        assignments: List[TaskAssignmentDetail] = []
        unassigned_task_ids: List[str] = []
        diffs: List[BeforeAfterDiff] = []
        logs: List[ActivityLog] = []

        # Map AGVs by ID for easy lookup and tracking current assignments
        agv_map = {a.id: a for a in agvs}
        assigned_agv_set = set()

        # Priority weights sorting key: URGENT (3) > HIGH (2) > NORMAL (1)
        priority_order = {TaskPriority.URGENT: 3, TaskPriority.HIGH: 2, TaskPriority.NORMAL: 1}
        
        # Only process tasks that are pending or assigned/in_progress needing re-eval
        active_and_pending_tasks = [t for t in tasks if t.status in [TaskStatus.PENDING, TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]]
        active_and_pending_tasks.sort(key=lambda t: priority_order.get(t.priority, 1), reverse=True)

        for task in active_and_pending_tasks:
            prev_agv_id = task.assigned_agv
            prev_route = list(task.assigned_route) if task.assigned_route else []
            prev_dist, prev_time, prev_cong = self.graph_engine.get_route_metrics(prev_route)

            candidates: List[CandidateScore] = []
            for agv in agvs:
                # If AGV is already assigned to a higher-priority task in this optimization cycle, skip it
                if agv.id in assigned_agv_set and agv.id != prev_agv_id:
                    candidates.append(CandidateScore(
                        agv_id=agv.id,
                        agv_name=agv.name,
                        eligible=False,
                        rejection_reason="Already Assigned to Higher Priority Task"
                    ))
                    continue

                c_score = self.evaluate_agv_for_task(agv, task)
                candidates.append(c_score)

            # Filter eligible candidates and sort by total score descending
            eligible_candidates = [c for c in candidates if c.eligible]
            eligible_candidates.sort(key=lambda c: c.total_score, reverse=True)

            selected_candidate: Optional[CandidateScore] = None

            if eligible_candidates:
                best_candidate = eligible_candidates[0]

                # Hysteresis Check: If task was already assigned to prev_agv_id and prev_agv is still eligible
                if prev_agv_id and prev_agv_id in agv_map:
                    prev_candidate = next((c for c in eligible_candidates if c.agv_id == prev_agv_id), None)
                    if prev_candidate:
                        # Keep previous AGV unless best candidate significantly outperforms it
                        if (best_candidate.total_score - prev_candidate.total_score) < self.STABILITY_THRESHOLD:
                            selected_candidate = prev_candidate
                        else:
                            selected_candidate = best_candidate
                    else:
                        selected_candidate = best_candidate
                else:
                    selected_candidate = best_candidate

            if selected_candidate:
                # Assigned successfully!
                agv_id = selected_candidate.agv_id
                assigned_agv_set.add(agv_id)
                agv_obj = agv_map[agv_id]

                # Calculate optimal path from AGV current location -> Source -> Destination
                pickup_path, _, _, _ = self.graph_engine.find_optimal_route(agv_obj.location, task.source)
                delivery_path, _, _, _ = self.graph_engine.find_optimal_route(task.source, task.destination)
                
                if pickup_path and delivery_path:
                    full_route = pickup_path[:-1] + delivery_path
                else:
                    full_route = delivery_path or [task.source, task.destination]

                # Compare pure shortest path vs dynamic optimal path for explainability
                sp_path, sp_dist, sp_cong = self.graph_engine.find_pure_shortest_route(task.source, task.destination)
                opt_path, opt_dist, opt_time, _ = self.graph_engine.find_optimal_route(task.source, task.destination)
                _, _, opt_cong = self.graph_engine.get_route_metrics(opt_path or [])

                detail = TaskAssignmentDetail(
                    task_id=task.id,
                    priority=task.priority,
                    assigned_agv=agv_id,
                    assigned_route=full_route,
                    total_distance=selected_candidate.total_distance,
                    estimated_time=selected_candidate.estimated_time,
                    selected_candidate=selected_candidate,
                    candidates=candidates,
                    shortest_path=sp_path,
                    shortest_path_distance=sp_dist,
                    shortest_path_congestion=sp_cong,
                    optimal_path=opt_path,
                    optimal_path_distance=opt_dist,
                    optimal_path_congestion=opt_cong
                )
                assignments.append(detail)

                # Update task object
                task.assigned_agv = agv_id
                task.assigned_route = full_route
                task.estimated_time = selected_candidate.estimated_time
                if task.status == TaskStatus.PENDING:
                    task.status = TaskStatus.ASSIGNED

                # Update AGV status
                if agv_obj.status == AGVStatus.AVAILABLE:
                    agv_obj.status = AGVStatus.BUSY
                agv_obj.current_task = task.id
                agv_obj.current_route = full_route
                agv_obj.route_index = 0
                agv_obj.estimated_completion_time = selected_candidate.estimated_time

                # Generate Before vs After Diff if AGV changed or route changed significantly
                if prev_agv_id != agv_id or prev_route != full_route:
                    diffs.append(BeforeAfterDiff(
                        task_id=task.id,
                        timestamp=now_str,
                        reason=trigger_reason,
                        previous_agv=prev_agv_id,
                        new_agv=agv_id,
                        previous_route=prev_route,
                        new_route=full_route,
                        previous_distance=prev_dist,
                        new_distance=selected_candidate.total_distance,
                        previous_congestion=prev_cong,
                        new_congestion=opt_cong
                    ))

                    log_msg = f"{task.id} reassigned to {agv_id} (Prev: {prev_agv_id or 'None'}) - Reason: {trigger_reason}"
                    logs.append(ActivityLog(
                        id=f"LOG-{uuid.uuid4().hex[:10]}",
                        timestamp=now_str,
                        level="warning" if prev_agv_id else "info",
                        event_type="reassignment" if prev_agv_id else "assignment",
                        message=log_msg,
                        details={"task_id": task.id, "agv_id": agv_id, "score": selected_candidate.total_score}
                    ))
            else:
                # Task could not be assigned
                unassigned_task_ids.append(task.id)
                task.assigned_agv = None
                task.assigned_route = []
                task.reason = "No feasible AGV available (Battery/Capacity/Route blocked)"

                detail = TaskAssignmentDetail(
                    task_id=task.id,
                    priority=task.priority,
                    assigned_agv=None,
                    assigned_route=[],
                    total_distance=0.0,
                    estimated_time=0.0,
                    selected_candidate=None,
                    candidates=candidates
                )
                assignments.append(detail)

                log_msg = f"NO FEASIBLE AGV FOR {task.id} ({task.priority.value}): Insufficient battery, capacity, or routes blocked."
                logs.append(ActivityLog(
                    id=f"LOG-{uuid.uuid4().hex[:10]}",
                    timestamp=now_str,
                    level="error",
                    event_type="assignment",
                    message=log_msg,
                    details={"task_id": task.id}
                ))

        summary_msg = f"Optimization run complete ({trigger_reason}). {len(assignments)} tasks processed."
        opt_result = OptimizationResult(
            timestamp=now_str,
            trigger_reason=trigger_reason,
            assignments=assignments,
            unassigned_tasks=unassigned_task_ids,
            activity_log_entry=summary_msg
        )

        return opt_result, diffs, logs
