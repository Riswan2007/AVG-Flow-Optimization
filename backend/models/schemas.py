from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class AGVStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    CHARGING = "charging"
    OFFLINE = "offline"

class TaskPriority(str, Enum):
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"

class TaskStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class NodePos(BaseModel):
    x: float
    y: float

class FactoryNode(BaseModel):
    id: str
    name: str
    type: str  # "storage", "machine", "production", "charging", "intersection"
    pos: NodePos

class FactoryEdge(BaseModel):
    source: str
    target: str
    distance: float  # meters
    travel_time: float  # base seconds
    congestion: float = 0.0  # 0 to 1 (0% to 100%)
    blocked: bool = False

class FactoryGraph(BaseModel):
    nodes: List[FactoryNode]
    edges: List[FactoryEdge]

class AGV(BaseModel):
    id: str
    name: str
    location: str
    battery: float  # percentage 0-100
    status: AGVStatus
    speed: float  # m/s
    capacity: float  # kg
    current_task: Optional[str] = None
    current_route: List[str] = Field(default_factory=list)
    route_index: int = 0
    sub_progress: float = 0.0  # progress between current and next node (0.0 to 1.0)
    estimated_completion_time: Optional[float] = None  # seconds remaining

class Task(BaseModel):
    id: str
    source: str
    destination: str
    material: str
    quantity: float  # kg
    priority: TaskPriority
    status: TaskStatus
    assigned_agv: Optional[str] = None
    assigned_route: List[str] = Field(default_factory=list)
    created_at: str
    estimated_time: Optional[float] = None
    reason: Optional[str] = None

class CandidateScore(BaseModel):
    agv_id: str
    agv_name: str
    eligible: bool
    rejection_reason: Optional[str] = None
    distance_to_source: float = 0.0
    task_route_distance: float = 0.0
    total_distance: float = 0.0
    estimated_time: float = 0.0
    battery_after_task: float = 0.0
    
    # Normalized component scores (0 to 100)
    score_distance: float = 0.0
    score_battery: float = 0.0
    score_route: float = 0.0
    score_priority: float = 0.0
    score_availability: float = 0.0
    total_score: float = 0.0

class TaskAssignmentDetail(BaseModel):
    task_id: str
    priority: TaskPriority
    assigned_agv: Optional[str]
    assigned_route: List[str]
    total_distance: float
    estimated_time: float
    selected_candidate: Optional[CandidateScore]
    candidates: List[CandidateScore]
    shortest_path: Optional[List[str]] = None
    shortest_path_distance: float = 0.0
    shortest_path_congestion: float = 0.0
    optimal_path: Optional[List[str]] = None
    optimal_path_distance: float = 0.0
    optimal_path_congestion: float = 0.0

class OptimizationResult(BaseModel):
    timestamp: str
    trigger_reason: str
    assignments: List[TaskAssignmentDetail]
    unassigned_tasks: List[str]
    activity_log_entry: str

class BeforeAfterDiff(BaseModel):
    task_id: str
    timestamp: str
    reason: str
    previous_agv: Optional[str]
    new_agv: Optional[str]
    previous_route: List[str]
    new_route: List[str]
    previous_distance: float
    new_distance: float
    previous_congestion: float
    new_congestion: float

class ActivityLog(BaseModel):
    id: str
    timestamp: str
    level: str  # "info", "warning", "error", "success"
    event_type: str  # "assignment", "reassignment", "reroute", "failure", "congestion", "battery", "block"
    message: str
    details: Optional[Dict[str, Any]] = None

class SimulationMetrics(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    active_tasks: int
    average_travel_distance: float
    average_completion_time: float
    agv_utilization: Dict[str, float]  # AGV ID -> percentage
    dynamic_reassignments: int
    rerouted_tasks: int
    average_battery: float

class SimulationState(BaseModel):
    is_running: bool
    speed: float  # 1.0, 2.0, 5.0, 10.0
    sim_time: float  # in-sim seconds
    status: str

# Payload schemas for API requests
class CreateTaskRequest(BaseModel):
    source: str
    destination: str
    material: str
    quantity: float
    priority: TaskPriority

class AGVFailureRequest(BaseModel):
    agv_id: Optional[str] = None  # if None, select first active AGV

class CongestionRequest(BaseModel):
    source: str
    target: str
    congestion: float  # 0.0 to 1.0

class BlockRouteRequest(BaseModel):
    source: str
    target: str
    blocked: bool

class BatteryDrainRequest(BaseModel):
    agv_id: Optional[str] = None
    drain_amount: float = 50.0

class SimulationControlRequest(BaseModel):
    action: str  # "start", "pause", "reset", "set_speed"
    speed: Optional[float] = 1.0
