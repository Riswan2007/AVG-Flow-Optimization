export type AGVStatus = 'available' | 'busy' | 'charging' | 'offline';
export type TaskPriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';

export interface NodePos {
  x: number;
  y: number;
  z?: number;
}

export interface FactoryNode {
  id: string;
  name: string;
  type: 'storage' | 'machine' | 'production' | 'charging' | 'intersection';
  pos: NodePos;
}

export interface FactoryEdge {
  source: string;
  target: string;
  distance: number;
  travel_time: number;
  congestion: number;
  blocked: boolean;
}

export interface FactoryGraph {
  nodes: FactoryNode[];
  edges: FactoryEdge[];
}

export interface AGV {
  id: string;
  name: string;
  location: string;
  battery: number;
  status: AGVStatus;
  speed: number;
  capacity: number;
  current_task: string | null;
  current_route: string[];
  route_index: number;
  sub_progress: number;
  estimated_completion_time: number | null;
}

export interface Task {
  id: string;
  source: string;
  destination: string;
  material: string;
  quantity: number;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_agv: string | null;
  assigned_route: string[];
  created_at: string;
  estimated_time: number | null;
  reason: string | null;
}

export interface CandidateScore {
  agv_id: string;
  agv_name: string;
  eligible: boolean;
  rejection_reason: string | null;
  distance_to_source: number;
  task_route_distance: number;
  total_distance: number;
  estimated_time: number;
  battery_after_task: number;
  score_distance: number;
  score_battery: number;
  score_route: number;
  score_priority: number;
  score_availability: number;
  total_score: number;
}

export interface TaskAssignmentDetail {
  task_id: string;
  priority: TaskPriority;
  assigned_agv: string | null;
  assigned_route: string[];
  total_distance: number;
  estimated_time: number;
  selected_candidate: CandidateScore | null;
  candidates: CandidateScore[];
  shortest_path: string[] | null;
  shortest_path_distance: number;
  shortest_path_congestion: number;
  optimal_path: string[] | null;
  optimal_path_distance: number;
  optimal_path_congestion: number;
}

export interface OptimizationResult {
  timestamp: string;
  trigger_reason: string;
  assignments: TaskAssignmentDetail[];
  unassigned_tasks: string[];
  activity_log_entry: string;
}

export interface BeforeAfterDiff {
  task_id: string;
  timestamp: string;
  reason: string;
  previous_agv: string | null;
  new_agv: string | null;
  previous_route: string[];
  new_route: string[];
  previous_distance: number;
  new_distance: number;
  previous_congestion: number;
  new_congestion: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  event_type: 'assignment' | 'reassignment' | 'reroute' | 'failure' | 'congestion' | 'battery' | 'block';
  message: string;
  details?: Record<string, any>;
}

export interface SimulationMetrics {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  active_tasks: number;
  average_travel_distance: number;
  average_completion_time: number;
  agv_utilization: Record<string, number>;
  dynamic_reassignments: number;
  rerouted_tasks: number;
  average_battery: number;
}

export interface SimulationState {
  is_running: boolean;
  speed: number;
  sim_time: number;
  status: string;
}
