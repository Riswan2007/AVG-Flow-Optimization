from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any, Optional
import datetime
import time
import uuid

from backend.models.schemas import (
    AGV, Task, FactoryGraph, OptimizationResult, BeforeAfterDiff, ActivityLog,
    SimulationMetrics, SimulationState, CreateTaskRequest, AGVFailureRequest,
    CongestionRequest, BlockRouteRequest, BatteryDrainRequest, SimulationControlRequest,
    TaskPriority, TaskStatus, AGVStatus
)
from backend.database.db import Database
from backend.optimization.graph_engine import FactoryGraphEngine
from backend.optimization.assignment_engine import AGVAssignmentEngine
from backend.simulation.simulator import SimulatorEngine

router = APIRouter(prefix="/api")

# Singletons injected at app startup
db: Database = None
graph_engine: FactoryGraphEngine = None
assignment_engine: AGVAssignmentEngine = None
simulator: SimulatorEngine = None

def init_api_deps(db_inst: Database, ge_inst: FactoryGraphEngine, ae_inst: AGVAssignmentEngine, sim_inst: SimulatorEngine):
    global db, graph_engine, assignment_engine, simulator
    db = db_inst
    graph_engine = ge_inst
    assignment_engine = ae_inst
    simulator = sim_inst

@router.get("/agvs", response_model=List[AGV])
def get_agvs():
    return db.get_all_agvs()

@router.get("/tasks", response_model=List[Task])
def get_tasks():
    return db.get_all_tasks()

@router.get("/factory", response_model=FactoryGraph)
def get_factory_graph():
    return graph_engine.to_factory_graph_schema()

@router.get("/optimization")
def get_latest_optimization():
    if not simulator.last_opt_result:
        simulator.run_optimization("Initial API Request")
    return {
        "result": simulator.last_opt_result,
        "last_optimization_time": simulator.last_optimization_time
    }

@router.get("/optimization/diffs", response_model=List[BeforeAfterDiff])
def get_optimization_diffs():
    return db.get_optimization_diffs(limit=20)

@router.get("/logs", response_model=List[ActivityLog])
def get_activity_logs():
    return db.get_activity_logs(limit=50)

@router.get("/analytics", response_model=SimulationMetrics)
def get_analytics():
    return simulator.get_metrics()

@router.post("/tasks", response_model=Task)
def create_task(req: CreateTaskRequest):
    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    tasks = db.get_all_tasks()
    task_num = len(tasks) + 1
    new_id = f"TASK-{task_num:03d}"

    new_task = Task(
        id=new_id,
        source=req.source,
        destination=req.destination,
        material=req.material,
        quantity=req.quantity,
        priority=req.priority,
        status=TaskStatus.PENDING,
        created_at=now_str
    )
    db.add_task(new_task)

    log_msg = f"NEW TASK CREATED: {new_id} ({req.material}, {req.quantity}kg, Priority: {req.priority.value}) from {req.source} to {req.destination}."
    db.add_activity_log(ActivityLog(
        id=f"LOG-{uuid.uuid4().hex[:10]}",
        timestamp=now_str,
        level="info",
        event_type="assignment",
        message=log_msg,
        details={"task_id": new_id, "priority": req.priority.value}
    ))

    # Trigger automatic re-optimization
    simulator.run_optimization(f"New Task Created ({new_id})")
    return new_task

@router.post("/optimize")
def manual_optimize():
    res = simulator.run_optimization("Manual User Trigger")
    return {"message": "Optimization executed successfully", "result": res}

# -------------------------------------------------------------
# Demo Event Injection Endpoints
# -------------------------------------------------------------

@router.post("/events/agv-failure")
def simulate_agv_failure(req: AGVFailureRequest):
    """
    Event 1: AGV Failure
    Selects an active/busy AGV (or specified AGV), marks it OFFLINE, and re-assigns its task.
    """
    agvs = db.get_all_agvs()
    target_agv: Optional[AGV] = None

    if req.agv_id:
        target_agv = next((a for a in agvs if a.id == req.agv_id), None)
    else:
        # Pick first active/busy AGV, or available AGV
        target_agv = next((a for a in agvs if a.status == AGVStatus.BUSY), None)
        if not target_agv:
            target_agv = next((a for a in agvs if a.status == AGVStatus.AVAILABLE), None)

    if not target_agv:
        raise HTTPException(status_code=400, detail="No AGV available to simulate failure.")

    prev_status = target_agv.status
    affected_task_id = target_agv.current_task

    # Set AGV offline
    target_agv.status = AGVStatus.OFFLINE
    target_agv.current_task = None
    target_agv.current_route = []
    db.update_agv(target_agv)

    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    log_msg = f"CRITICAL AGV FAILURE: {target_agv.id} status changed to OFFLINE."
    if affected_task_id:
        log_msg += f" Task {affected_task_id} interrupted and marked for reassignment."

    db.add_activity_log(ActivityLog(
        id=f"LOG-{uuid.uuid4().hex[:10]}",
        timestamp=now_str,
        level="error",
        event_type="failure",
        message=log_msg,
        details={"agv_id": target_agv.id, "affected_task": affected_task_id}
    ))

    # Auto Re-optimize!
    opt_res = simulator.run_optimization(f"AGV Failure ({target_agv.id} OFFLINE)")
    return {
        "message": f"Simulated failure for {target_agv.id}",
        "failed_agv": target_agv.id,
        "affected_task": affected_task_id,
        "optimization": opt_res
    }

@router.post("/events/urgent-task")
def create_urgent_task():
    """
    Event 2: Create Urgent Task
    Creates a high priority task and triggers immediate re-optimization.
    """
    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    tasks = db.get_all_tasks()
    task_num = len(tasks) + 1
    new_id = f"TASK-{task_num:03d}"

    urgent_task = Task(
        id=new_id,
        source="Storage-A",
        destination="Machine-02",
        material="Emergency Parts",
        quantity=120.0,
        priority=TaskPriority.URGENT,
        status=TaskStatus.PENDING,
        created_at=now_str
    )
    db.add_task(urgent_task)

    db.add_activity_log(ActivityLog(
        id=f"LOG-{uuid.uuid4().hex[:10]}",
        timestamp=now_str,
        level="warning",
        event_type="assignment",
        message=f"NEW URGENT TASK CREATED: {new_id} from Storage-A to Machine-02.",
        details={"task_id": new_id, "priority": "URGENT"}
    ))

    opt_res = simulator.run_optimization(f"New Urgent Task ({new_id})")
    return {
        "message": f"Created urgent task {new_id}",
        "task": urgent_task,
        "optimization": opt_res
    }

@router.post("/events/congestion")
def simulate_congestion(req: CongestionRequest):
    """
    Event 3: Route Congestion
    Spikes edge congestion (e.g. N2 -> N4 from 20% to 90%) and re-evaluates route costs.
    """
    graph_engine.update_edge_status(req.source, req.target, congestion=req.congestion)
    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    
    db.add_activity_log(ActivityLog(
        id=f"LOG-{uuid.uuid4().hex[:10]}",
        timestamp=now_str,
        level="warning",
        event_type="congestion",
        message=f"CONGESTION SPIKE: Route {req.source} - {req.target} congestion updated to {int(req.congestion*100)}%.",
        details={"edge": f"{req.source}-{req.target}", "congestion": req.congestion}
    ))

    simulator.total_rerouted += 1
    opt_res = simulator.run_optimization(f"Congestion Update on {req.source}-{req.target} ({int(req.congestion*100)}%)")
    return {
        "message": f"Updated congestion on {req.source}-{req.target}",
        "congestion": req.congestion,
        "optimization": opt_res
    }

@router.post("/events/block-route")
def block_route(req: BlockRouteRequest):
    """
    Event 5: Block Route
    Sets edge blocked state to True or False. Forces Dijkstra to bypass blocked routes completely.
    """
    graph_engine.update_edge_status(req.source, req.target, blocked=req.blocked)
    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    action_str = "BLOCKED" if req.blocked else "UNBLOCKED"
    
    db.add_activity_log(ActivityLog(
        id=f"LOG-{uuid.uuid4().hex[:10]}",
        timestamp=now_str,
        level="error" if req.blocked else "info",
        event_type="block",
        message=f"ROUTE {action_str}: Edge {req.source} - {req.target} is now {'BLOCKED' if req.blocked else 'OPEN'}.",
        details={"edge": f"{req.source}-{req.target}", "blocked": req.blocked}
    ))

    opt_res = simulator.run_optimization(f"Route {action_str} ({req.source}-{req.target})")
    return {
        "message": f"Route {req.source}-{req.target} set to blocked={req.blocked}",
        "blocked": req.blocked,
        "optimization": opt_res
    }

@router.post("/events/battery-drain")
def simulate_battery_drain(req: BatteryDrainRequest):
    """
    Event 4: Battery Drain
    Drains specified AGV battery by given percentage.
    """
    agvs = db.get_all_agvs()
    target_agv: Optional[AGV] = None
    if req.agv_id:
        target_agv = next((a for a in agvs if a.id == req.agv_id), None)
    else:
        target_agv = next((a for a in agvs if a.status == AGVStatus.BUSY), None)
        if not target_agv:
            target_agv = next((a for a in agvs if a.status == AGVStatus.AVAILABLE), None)

    if not target_agv:
        raise HTTPException(status_code=400, detail="No AGV available to drain battery.")

    old_battery = target_agv.battery
    target_agv.battery = max(5.0, target_agv.battery - req.drain_amount)
    db.update_agv(target_agv)

    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    db.add_activity_log(ActivityLog(
        id=f"LOG-{uuid.uuid4().hex[:10]}",
        timestamp=now_str,
        level="warning",
        event_type="battery",
        message=f"BATTERY DRAIN SIMULATED: {target_agv.id} dropped from {old_battery:.0f}% to {target_agv.battery:.0f}%.",
        details={"agv_id": target_agv.id, "battery": target_agv.battery}
    ))

    opt_res = simulator.run_optimization(f"Battery Drain on {target_agv.id}")
    return {
        "message": f"Drained battery of {target_agv.id}",
        "agv": target_agv.id,
        "new_battery": target_agv.battery,
        "optimization": opt_res
    }

# -------------------------------------------------------------
# Simulation Controls
# -------------------------------------------------------------

@router.post("/simulation/control", response_model=SimulationState)
def control_simulation(req: SimulationControlRequest):
    if req.action == "start":
        simulator.start()
    elif req.action == "pause":
        simulator.pause()
    elif req.action == "reset":
        simulator.reset()
    elif req.action == "set_speed":
        if req.speed:
            simulator.set_speed(req.speed)
    
    return simulator.get_simulation_state()

@router.get("/simulation/state", response_model=SimulationState)
def get_simulation_state():
    return simulator.get_simulation_state()
