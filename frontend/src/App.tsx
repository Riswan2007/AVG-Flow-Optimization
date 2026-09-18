import { useEffect, useState, useCallback } from 'react';
import type {
  AGV, Task, FactoryNode, FactoryEdge, OptimizationResult, BeforeAfterDiff,
  ActivityLog, SimulationMetrics, SimulationState
} from './types/smartagv';
import { api } from './services/api';

import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { FactoryMap } from './components/FactoryMap';
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
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
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
      setDiffs(diffList);
      setLogs(logList);
      setMetrics(metricsData);
      setSimState(simStateData);
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Error fetching factory state:', err);
      setErrorMsg('Failed to connect to SmartAGV Backend Engine at http://localhost:8000.');
    }
  }, []);

  // Poll state every 800ms
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 800);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleManualOptimize = async () => {
    setIsOptimizing(true);
    try {
      await api.triggerOptimize();
      await fetchData();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCreateTask = async (payload: { source: string; destination: string; material: string; quantity: number; priority: string }) => {
    setIsOptimizing(true);
    try {
      await api.createTask(payload);
      await fetchData();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSimulateAGVFailure = async (agvId?: string) => {
    setIsOptimizing(true);
    try {
      await api.triggerAGVFailure(agvId);
      await fetchData();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCreateUrgentTask = async () => {
    setIsOptimizing(true);
    try {
      await api.triggerUrgentTask();
      await fetchData();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSimulateCongestion = async (source: string, target: string, congestion: number) => {
    setIsOptimizing(true);
    try {
      await api.triggerCongestion(source, target, congestion);
      await fetchData();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleBlockRoute = async (source: string, target: string, blocked: boolean) => {
    setIsOptimizing(true);
    try {
      await api.triggerBlockRoute(source, target, blocked);
      await fetchData();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSimulateBatteryDrain = async (agvId?: string) => {
    setIsOptimizing(true);
    try {
      await api.triggerBatteryDrain(agvId, 50.0);
      await fetchData();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSimulationControl = async (action: string, speed?: number) => {
    try {
      const newState = await api.controlSimulation(action, speed);
      setSimState(newState);
      fetchData();
    } catch (err) {
      console.error('Failed to control simulation:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Header
        systemStatus={simState.status}
        simTime={simState.sim_time}
        lastOptTime={lastOptTime}
        isOptimizing={isOptimizing}
        onManualOptimize={handleManualOptimize}
      />

      {errorMsg && (
        <div className="bg-red-950 border-b border-red-800 text-red-200 px-6 py-2.5 text-xs text-center font-medium">
          {errorMsg} Please ensure the backend is running via <code className="bg-red-900 px-1.5 py-0.5 rounded">python -m uvicorn backend.main:app --port 8000</code>.
        </div>
      )}

      <main className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* KPI Cards Row */}
        <KPICards agvs={agvs} tasks={tasks} edges={edges} />

        {/* Hackathon Demo Event Trigger Panel */}
        <DynamicEventPanel
          onSimulateAGVFailure={() => handleSimulateAGVFailure(selectedAgvId || undefined)}
          onCreateUrgentTask={handleCreateUrgentTask}
          onSimulateCongestion={handleSimulateCongestion}
          onSimulateBatteryDrain={() => handleSimulateBatteryDrain(selectedAgvId || undefined)}
          onBlockRoute={handleBlockRoute}
        />

        {/* Simulation Controls */}
        <SimulationControls state={simState} onControl={handleSimulationControl} />

        {/* Main Grid: Interactive Map + Decision Explainability */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive 2D Factory Map + Before/After Diffs */}
          <div className="lg:col-span-7 space-y-6">
            <FactoryMap
              nodes={nodes}
              edges={edges}
              agvs={agvs}
              tasks={tasks}
              selectedAgvId={selectedAgvId}
              selectedTaskId={selectedTaskId}
              onSelectAgv={(id) => setSelectedAgvId(id === selectedAgvId ? null : id)}
              onSelectTask={(id) => setSelectedTaskId(id === selectedTaskId ? null : id)}
            />

            <BeforeAfterOptimizationView diffs={diffs} />
          </div>

          {/* Right Column: Optimization Engine Explainability Panel */}
          <div className="lg:col-span-5 space-y-6">
            <OptimizationExplanationPanel
              optimizationResult={optResult}
              selectedTaskId={selectedTaskId}
            />

            <ActivityLogPanel logs={logs} />
          </div>
        </div>

        {/* Fleet & Task Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AGVPanel
            agvs={agvs}
            selectedAgvId={selectedAgvId}
            onSelectAgv={(id) => setSelectedAgvId(id === selectedAgvId ? null : id)}
            onDrainBattery={(id) => handleSimulateBatteryDrain(id)}
            onSimulateFailure={(id) => handleSimulateAGVFailure(id)}
          />

          <TaskPanel
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(id) => setSelectedTaskId(id === selectedTaskId ? null : id)}
            onCreateTask={handleCreateTask}
          />
        </div>

        {/* Analytics & Performance Charts */}
        <AnalyticsPanel metrics={metrics} />
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        SmartAGV Optimization System · Built with React, Vite, TypeScript, Tailwind CSS, Python, FastAPI, and NetworkX.
      </footer>
    </div>
  );
}
