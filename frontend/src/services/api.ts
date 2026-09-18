import type {
  AGV, Task, FactoryGraph, OptimizationResult, BeforeAfterDiff,
  ActivityLog, SimulationMetrics, SimulationState
} from '../types/smartagv';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = {
  async getAGVs(): Promise<AGV[]> {
    const res = await fetch(`${API_BASE_URL}/agvs`);
    if (!res.ok) throw new Error('Failed to fetch AGVs');
    return res.json();
  },

  async getTasks(): Promise<Task[]> {
    const res = await fetch(`${API_BASE_URL}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getFactoryGraph(): Promise<FactoryGraph> {
    const res = await fetch(`${API_BASE_URL}/factory`);
    if (!res.ok) throw new Error('Failed to fetch factory graph');
    return res.json();
  },

  async getOptimization(): Promise<{ result: OptimizationResult; last_optimization_time: string }> {
    const res = await fetch(`${API_BASE_URL}/optimization`);
    if (!res.ok) throw new Error('Failed to fetch optimization data');
    return res.json();
  },

  async getOptimizationDiffs(): Promise<BeforeAfterDiff[]> {
    const res = await fetch(`${API_BASE_URL}/optimization/diffs`);
    if (!res.ok) throw new Error('Failed to fetch optimization diffs');
    return res.json();
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE_URL}/logs`);
    if (!res.ok) throw new Error('Failed to fetch activity logs');
    return res.json();
  },

  async getAnalytics(): Promise<SimulationMetrics> {
    const res = await fetch(`${API_BASE_URL}/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getSimulationState(): Promise<SimulationState> {
    const res = await fetch(`${API_BASE_URL}/simulation/state`);
    if (!res.ok) throw new Error('Failed to fetch simulation state');
    return res.json();
  },

  async createTask(payload: { source: string; destination: string; material: string; quantity: number; priority: string }): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async triggerOptimize(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/optimize`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger optimization');
    return res.json();
  },

  async triggerAGVFailure(agvId?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/events/agv-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agv_id: agvId })
    });
    if (!res.ok) throw new Error('Failed to trigger AGV failure');
    return res.json();
  },

  async triggerUrgentTask(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/events/urgent-task`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger urgent task');
    return res.json();
  },

  async triggerCongestion(source: string, target: string, congestion: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/events/congestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, target, congestion })
    });
    if (!res.ok) throw new Error('Failed to trigger congestion');
    return res.json();
  },

  async triggerBlockRoute(source: string, target: string, blocked: boolean): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/events/block-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, target, blocked })
    });
    if (!res.ok) throw new Error('Failed to block route');
    return res.json();
  },

  async triggerBatteryDrain(agvId?: string, drainAmount: number = 50): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/events/battery-drain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agv_id: agvId, drain_amount: drainAmount })
    });
    if (!res.ok) throw new Error('Failed to drain battery');
    return res.json();
  },

  async controlSimulation(action: string, speed?: number): Promise<SimulationState> {
    const res = await fetch(`${API_BASE_URL}/simulation/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, speed })
    });
    if (!res.ok) throw new Error('Failed to control simulation');
    return res.json();
  }
};
