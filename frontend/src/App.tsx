import { useEffect, useState, useCallback } from 'react';
import type {
  AGV, Task, FactoryNode, FactoryEdge, OptimizationResult, BeforeAfterDiff,
  ActivityLog, SimulationMetrics, SimulationState, TaskAssignmentDetail
} from './types/smartagv';
import { api } from './services/api';

import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { FactoryScene3D } from './components/3d/FactoryScene3D';
import { InspectorPanel3D } from './components/3d/InspectorPanel3D';
import { ReoptimizationOverlay } from './components/3d/ReoptimizationOverlay';
import { AGVPanel } from './components/AGVPanel';
import { TaskPanel } from './components/TaskPanel';
import { OptimizationExplanationPanel } from './components/OptimizationExplanationPanel';
import { BeforeAfterOptimizationView } from './components/BeforeAfterOptimizationView';
import { DynamicEventPanel } from './components/DynamicEventPanel';
import { ActivityLogPanel } from './components/ActivityLogPanel';
import { SimulationControls } from './components/SimulationControls';
import { AnalyticsPanel } from './components/AnalyticsPanel';

export function App() {
  const [agvs, setAgvs] = useState<AGV[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nodes, setNodes] = useState<FactoryNode[]>([]);
  const [edges, setEdges] = useState<FactoryEdge[]>([]);
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);
  const [lastOptTime, setLastOptTime] = useState<string>('');
  const [diffs, setDiffs] = useState<BeforeAfterDiff[]>([]);
  const [latestDiff, setLatestDiff] = useState<BeforeAfterDiff | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [metrics, setMetrics] = useState<SimulationMetrics | null>(null);
  const [simState, setSimState] = useState<SimulationState>({
    is_running: false,
    speed: 1.0,
    sim_time: 0.0,
    status: 'Paused'
  });

  const [selectedAgvId, setSelectedAgvId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<{ source: string; target: string } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [triggerOverlayReason, setTriggerOverlayReason] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch all factory state data from FastAPI backend
  const fetchData = useCallback(async () => {
    try {
      const [agvList, taskList, graphData, optData, diffList, logList, metricsData, simStateData] = await Promise.all([
        api.getAGVs(),
        api.getTasks(),
        api.getFactoryGraph(),
        api.getOptimization(),
        api.getOptimizationDiffs(),
        api.getActivityLogs(),
        api.getAnalytics(),
        api.getSimulationState()
      ]);

      setAgvs(agvList);
      setTasks(taskList);
      setNodes(graphData.nodes);
      setEdges(graphData.edges);
      setOptResult(optData.result);
      setLastOptTime(optData.last_optimization_time);

      if (diffList.length > 0 && JSON.stringify(diffList[0]) !== JSON.stringify(latestDiff)) {
        setLatestDiff(diffList[0]);
      }
      setDiffs(diffList);
      setLogs(logList);
      setMetrics(metricsData);
      setSimState(simStateData);
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Error fetching factory state:', err);
      setErrorMsg('Failed to connect to SmartAGV Backend Engine at http://localhost:8000.');
    }
  }, [latestDiff]);

  // Poll state every 800ms
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 800);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTriggerEvent = async (actionFn: () => Promise<any>, reason: string) => {
    setIsOptimizing(true);
    setTriggerOverlayReason(reason);
    try {
      await actionFn();
      await fetchData();
    } finally {
      setIsOptimizing(false);
    }
  };

  const selectedAgv = selectedAgvId ? agvs.find(a => a.id === selectedAgvId) || null : null;
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null;
  const selectedEdge = selectedEdgeKey ? edges.find(e => [e.source, e.target].sort().join('::') === [selectedEdgeKey.source, selectedEdgeKey.target].sort().join('::')) || null : null;
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null;

  let activeAssignmentDetail: TaskAssignmentDetail | null = null;
  if (optResult && optResult.assignments) {
    if (selectedTaskId) {
      activeAssignmentDetail = optResult.assignments.find(a => a.task_id === selectedTaskId) || null;
    } else if (selectedAgvId) {
      activeAssignmentDetail = optResult.assignments.find(a => a.assigned_agv === selectedAgvId) || null;
    }
    if (!activeAssignmentDetail && optResult.assignments.length > 0) {
      activeAssignmentDetail = optResult.assignments[0];
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Header
        systemStatus={simState.status}
        simTime={simState.sim_time}
        lastOptTime={lastOptTime}
        isOptimizing={isOptimizing}
        onManualOptimize={() => handleTriggerEvent(() => api.triggerOptimize(), 'Manual User Trigger')}
      />

      {errorMsg && (
        <div className="bg-red-950 border-b border-red-800 text-red-200 px-6 py-2.5 text-xs text-center font-medium">
          {errorMsg} Please ensure backend is running via <code className="bg-red-900 px-1.5 py-0.5 rounded">python -m uvicorn backend.main:app --port 8000</code>.
        </div>
      )}

      {/* Prominent "RE-OPTIMIZATION TRIGGERED" Overlay */}
      {triggerOverlayReason && (
        <ReoptimizationOverlay
          latestDiff={latestDiff}
          triggerReason={triggerOverlayReason}
          onClose={() => setTriggerOverlayReason(null)}
        />
      )}

      <main className="flex-1 p-6 space-y-6 max-w-[1700px] w-full mx-auto">
        {/* KPI Cards Row */}
        <KPICards agvs={agvs} tasks={tasks} edges={edges} />

        {/* Hackathon Demo Event Trigger Panel */}
        <DynamicEventPanel
          onSimulateAGVFailure={() => handleTriggerEvent(() => api.triggerAGVFailure(selectedAgvId || undefined), 'Simulated AGV Failure')}
          onCreateUrgentTask={() => handleTriggerEvent(() => api.triggerUrgentTask(), 'New Urgent Task Created')}
          onSimulateCongestion={(s, t, c) => handleTriggerEvent(() => api.triggerCongestion(s, t, c), 'Route Congestion Spike')}
          onSimulateBatteryDrain={() => handleTriggerEvent(() => api.triggerBatteryDrain(selectedAgvId || undefined, 50.0), 'AGV Battery Drain')}
          onBlockRoute={(s, t, b) => handleTriggerEvent(() => api.triggerBlockRoute(s, t, b), b ? 'Route Blocked' : 'Route Unblocked')}
        />

        {/* Simulation Controls */}
        <SimulationControls state={simState} onControl={(act, spd) => api.controlSimulation(act, spd).then(setSimState)} />

        {/* Main Grid: Interactive 3D Viewport + Decision Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive 3D Scene + Before/After Diffs */}
          <div className="lg:col-span-8 space-y-6">
            <FactoryScene3D
              nodes={nodes}
              edges={edges}
              agvs={agvs}
              tasks={tasks}
              selectedAgvId={selectedAgvId}
              selectedTaskId={selectedTaskId}
              onSelectAgv={(id) => {
                setSelectedAgvId(id === selectedAgvId ? null : id);
                setSelectedTaskId(null);
                setSelectedEdgeKey(null);
                setSelectedNodeId(null);
              }}
              onSelectTask={(id) => {
                setSelectedTaskId(id === selectedTaskId ? null : id);
                setSelectedAgvId(null);
                setSelectedEdgeKey(null);
                setSelectedNodeId(null);
              }}
              onSelectRoute={(s, t) => {
                setSelectedEdgeKey({ source: s, target: t });
                setSelectedAgvId(null);
                setSelectedTaskId(null);
                setSelectedNodeId(null);
              }}
              onSelectNode={(id) => {
                setSelectedNodeId(id === selectedNodeId ? null : id);
                setSelectedAgvId(null);
                setSelectedTaskId(null);
                setSelectedEdgeKey(null);
              }}
            />

            <BeforeAfterOptimizationView diffs={diffs} />
          </div>

          {/* Right Column: Inspector Side Drawer + Optimization Explanation + Logs */}
          <div className="lg:col-span-4 space-y-6">
            <InspectorPanel3D
              selectedAgv={selectedAgv}
              selectedTask={selectedTask}
              selectedEdge={selectedEdge}
              selectedNode={selectedNode}
              assignmentDetail={activeAssignmentDetail}
              onClose={() => {
                setSelectedAgvId(null);
                setSelectedTaskId(null);
                setSelectedEdgeKey(null);
                setSelectedNodeId(null);
              }}
            />

            <OptimizationExplanationPanel
              optimizationResult={optResult}
              selectedTaskId={selectedTaskId}
            />

            <ActivityLogPanel logs={logs} />
          </div>
        </div>

        {/* Fleet Status & Task Management Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AGVPanel
            agvs={agvs}
            selectedAgvId={selectedAgvId}
            onSelectAgv={(id) => setSelectedAgvId(id === selectedAgvId ? null : id)}
            onDrainBattery={(id) => handleTriggerEvent(() => api.triggerBatteryDrain(id, 50.0), `Battery Drain on ${id}`)}
            onSimulateFailure={(id) => handleTriggerEvent(() => api.triggerAGVFailure(id), `AGV ${id} Set Offline`)}
          />

          <TaskPanel
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(id) => setSelectedTaskId(id === selectedTaskId ? null : id)}
            onCreateTask={(p) => handleTriggerEvent(() => api.createTask(p), `New Task Created (${p.material})`)}
          />
        </div>

        {/* Analytics & Performance Metrics */}
        <AnalyticsPanel metrics={metrics} />
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        SmartAGV 3D Optimization System · Powered by React Three Fiber, Three.js, Drei, Python FastAPI, and NetworkX.
      </footer>
    </div>
  );
}
