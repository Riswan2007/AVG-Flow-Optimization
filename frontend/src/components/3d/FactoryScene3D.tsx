import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { FactoryNode, FactoryEdge, AGV, Task, TaskAssignmentDetail } from '../../types/smartagv';
import { FactoryEnvironment3D } from './FactoryEnvironment3D';
import { StorageArea3D } from './StorageArea3D';
import { Machine3D } from './Machine3D';
import { ChargingStation3D } from './ChargingStation3D';
import { RouteVisualization3D } from './RouteVisualization3D';
import { AGVFleet3D } from './AGVFleet3D';
import { TaskMarker3D } from './TaskMarker3D';
import { CameraControls3D } from './CameraControls3D';
import { Legend3D } from './Legend3D';
import { ExplainMode3D } from './ExplainMode3D';
import { Camera, Eye, RotateCcw, HelpCircle } from 'lucide-react';

interface FactoryScene3DProps {
  nodes: FactoryNode[];
  edges: FactoryEdge[];
  agvs: AGV[];
  tasks: Task[];
  selectedAgvId: string | null;
  selectedTaskId: string | null;
  assignmentDetail: TaskAssignmentDetail | null;
  isExplainMode: boolean;
  onToggleExplainMode: () => void;
  onSelectAgv: (agvId: string) => void;
  onSelectTask: (taskId: string) => void;
  onSelectRoute: (source: string, target: string) => void;
  onSelectNode: (nodeId: string) => void;
}

export const FactoryScene3D: React.FC<FactoryScene3DProps> = ({
  nodes,
  edges,
  agvs,
  tasks,
  selectedAgvId,
  selectedTaskId,
  assignmentDetail,
  isExplainMode,
  onToggleExplainMode,
  onSelectAgv,
  onSelectTask,
  onSelectRoute,
  onSelectNode
}) => {
  const [cameraMode, setCameraMode] = useState<'reset' | 'top' | 'iso' | 'follow'>('reset');
  const [hoveredAgvId, setHoveredAgvId] = useState<string | null>(null);

  // Compute active route edges for selected AGV or Task
  const activeRouteEdges = new Set<string>();
  if (selectedAgvId) {
    const targetAgv = agvs.find(a => a.id === selectedAgvId);
    if (targetAgv && targetAgv.current_route) {
      for (let i = 0; i < targetAgv.current_route.length - 1; i++) {
        const u = targetAgv.current_route[i];
        const v = targetAgv.current_route[i + 1];
        activeRouteEdges.add([u, v].sort().join('::'));
      }
    }
  } else if (selectedTaskId) {
    const targetTask = tasks.find(t => t.id === selectedTaskId);
    if (targetTask && targetTask.assigned_route) {
      for (let i = 0; i < targetTask.assigned_route.length - 1; i++) {
        const u = targetTask.assigned_route[i];
        const v = targetTask.assigned_route[i + 1];
        activeRouteEdges.add([u, v].sort().join('::'));
      }
    }
  }

  return (
    <div className="relative w-full aspect-[16/9] min-h-[520px] bg-slate-950 rounded-2xl border-2 border-cyan-500/30 overflow-hidden shadow-2xl">
      {/* Rectangular Box Title Badge */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
        <span className="text-xs font-extrabold text-white tracking-wider uppercase font-mono">
          3D FACTORY DIGITAL TWIN BOX
        </span>
      </div>

      {/* 3D Visual Key Legend */}
      <Legend3D />

      {/* Interactive Camera & Explain Mode Bar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-2xl backdrop-blur-md flex-wrap">
        <button
          onClick={onToggleExplainMode}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            isExplainMode
              ? 'bg-amber-500 text-slate-950 shadow-lg font-extrabold animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {isExplainMode ? 'EXIT EXPLAIN MODE' : 'EXPLAIN CURRENT OPTIMIZATION'}
        </button>

        <div className="h-4 w-[1px] bg-slate-800 my-auto"></div>

        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-cyan-400" /> Camera:
        </span>
        <button
          onClick={() => { setCameraMode('reset'); onSelectAgv(''); }}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            cameraMode === 'reset' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <button
          onClick={() => setCameraMode('top')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            cameraMode === 'top' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Eye className="w-3 h-3" /> Top View
        </button>
        <button
          onClick={() => setCameraMode('iso')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            cameraMode === 'iso' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Isometric
        </button>

        {/* Dynamic AGV Follow Dropdown for Instant Selection & Camera Tracking */}
        <select
          value={cameraMode === 'follow' && selectedAgvId ? selectedAgvId : ''}
          onChange={(e) => {
            const agvId = e.target.value;
            if (agvId) {
              onSelectAgv(agvId);
              setCameraMode('follow');
            } else {
              setCameraMode('reset');
            }
          }}
          className="bg-slate-950 border border-slate-700 text-cyan-300 font-bold text-xs rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-cyan-500 transition-all"
        >
          <option value="">🎥 Follow AGV Target...</option>
          {agvs.map((a) => (
            <option key={a.id} value={a.id}>
              🤖 Follow {a.id} ({a.status.toUpperCase()} - {Math.round(a.battery)}%)
            </option>
          ))}
        </select>
      </div>

      {/* Quick 3D Interaction Usability Hint Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/85 border border-slate-800 px-3 py-1.5 rounded-xl backdrop-blur-md text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span><strong>Click 3D AGVs, Racks, or Machines</strong> to inspect telemetry & active decision metrics</span>
      </div>

      {/* R3F WebGL 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [3, 30, 38], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Explain Mode Dimmed Backdrop & Highlights */}
        {isExplainMode && (
          <ExplainMode3D assignmentDetail={assignmentDetail} nodes={nodes} />
        )}
        {/* Lights Setup */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[30, 50, 40]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-30, 25, -20]} intensity={0.5} color="#38bdf8" />
        <pointLight position={[30, 25, 20]} intensity={0.5} color="#a855f7" />

        {/* Camera Rig Controls */}
        <CameraControls3D
          mode={cameraMode}
          selectedAgvId={selectedAgvId}
          agvs={agvs}
          nodes={nodes}
        />

        {/* 3D Factory Floor Environment */}
        <FactoryEnvironment3D />

        {/* 3D Roads & Route Path Visualizations */}
        <RouteVisualization3D
          edges={edges}
          nodes={nodes}
          activeRouteEdges={activeRouteEdges}
          onSelectRoute={onSelectRoute}
        />

        {/* 3D Stations (Storage, Machines, Production, Charging) */}
        {nodes.map((node) => {
          if (node.type === 'storage') {
            return <StorageArea3D key={node.id} node={node} onSelectNode={onSelectNode} />;
          }
          if (node.type === 'machine' || node.type === 'production') {
            return <Machine3D key={node.id} node={node} onSelectNode={onSelectNode} />;
          }
          if (node.type === 'charging') {
            return <ChargingStation3D key={node.id} node={node} onSelectNode={onSelectNode} />;
          }
          return null;
        })}

        {/* 3D Task Beacons */}
        {tasks.map((task) => (
          <TaskMarker3D key={task.id} task={task} nodes={nodes} onSelectTask={onSelectTask} />
        ))}

        {/* 3D AGV Fleet */}
        <AGVFleet3D
          agvs={agvs}
          nodes={nodes}
          selectedAgvId={selectedAgvId}
          hoveredAgvId={hoveredAgvId}
          onSelectAgv={onSelectAgv}
          onHoverAgv={setHoveredAgvId}
        />
      </Canvas>
    </div>
  );
};
