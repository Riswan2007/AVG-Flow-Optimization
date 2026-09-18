import React from 'react';
import type { AGV, Task, FactoryEdge, FactoryNode, TaskAssignmentDetail } from '../../types/smartagv';
import { Info, Truck, Package, ArrowRight, X } from 'lucide-react';

interface InspectorPanel3DProps {
  selectedAgv: AGV | null;
  selectedTask: Task | null;
  selectedEdge: FactoryEdge | null;
  selectedNode: FactoryNode | null;
  assignmentDetail: TaskAssignmentDetail | null;
  onClose: () => void;
}

export const InspectorPanel3D: React.FC<InspectorPanel3DProps> = ({
  selectedAgv,
  selectedTask,
  selectedEdge,
  selectedNode,
  assignmentDetail,
  onClose
}) => {
  if (!selectedAgv && !selectedTask && !selectedEdge && !selectedNode) return null;

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-slate-800 shadow-2xl p-5 backdrop-blur-md text-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-wide">3D Scene Telemetry Inspector</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selected AGV Details */}
      {selectedAgv && (
        <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-extrabold text-cyan-400 text-sm flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-cyan-400" /> {selectedAgv.id} ({selectedAgv.name})
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {selectedAgv.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div><span className="text-slate-500">Location:</span> <span className="font-semibold text-white">{selectedAgv.location}</span></div>
            <div><span className="text-slate-500">Battery:</span> <span className="font-mono font-bold text-emerald-400">{Math.round(selectedAgv.battery)}%</span></div>
            <div><span className="text-slate-500">Capacity:</span> <span className="font-semibold text-white">{selectedAgv.capacity} kg</span></div>
            <div><span className="text-slate-500">Speed:</span> <span className="font-semibold text-white">{selectedAgv.speed} m/s</span></div>
          </div>

          {selectedAgv.current_task ? (
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <div className="font-semibold text-cyan-300">Active Task: {selectedAgv.current_task}</div>
              <div className="text-[10px] text-slate-400 truncate">
                Route: <span className="font-mono text-slate-200">{selectedAgv.current_route.join(' → ')}</span>
              </div>
            </div>
          ) : (
            <div className="p-2 bg-slate-900/50 rounded text-slate-500 italic">No active task assigned.</div>
          )}

          {assignmentDetail && assignmentDetail.selected_candidate && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Optimization Score: {assignmentDetail.selected_candidate.total_score.toFixed(1)} / 100
              </span>
            </div>
          )}
        </div>
      )}

      {/* Selected Task Details */}
      {selectedTask && (
        <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-extrabold text-cyan-400 text-sm flex items-center gap-1.5">
              <Package className="w-4 h-4 text-cyan-400" /> {selectedTask.id}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
              selectedTask.priority === 'URGENT' ? 'bg-red-950 text-red-400 border-red-800' :
              selectedTask.priority === 'HIGH' ? 'bg-amber-950 text-amber-400 border-amber-800' :
              'bg-blue-950 text-blue-400 border-blue-800'
            }`}>
              {selectedTask.priority}
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div><span className="text-slate-500">Material:</span> <span className="font-semibold text-white">{selectedTask.material} ({selectedTask.quantity} kg)</span></div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Route:</span>
              <span className="font-semibold text-white">{selectedTask.source}</span>
              <ArrowRight className="w-3 h-3 text-cyan-400" />
              <span className="font-semibold text-white">{selectedTask.destination}</span>
            </div>
            <div><span className="text-slate-500">Assigned AGV:</span> <span className="font-bold text-cyan-300">{selectedTask.assigned_agv || 'None'}</span></div>
            <div><span className="text-slate-500">Status:</span> <span className="font-semibold text-emerald-400">{selectedTask.status}</span></div>
          </div>
        </div>
      )}

      {/* Selected Route / Edge Details */}
      {selectedEdge && (
        <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-extrabold text-cyan-400 text-sm flex items-center gap-1.5">
              Route Segment: {selectedEdge.source} → {selectedEdge.target}
            </span>
            {selectedEdge.blocked ? (
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-950 text-red-400 border border-red-800 rounded">BLOCKED</span>
            ) : selectedEdge.congestion > 0.5 ? (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 rounded">CONGESTED</span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">CLEAR</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div><span className="text-slate-500">Distance:</span> <span className="font-mono font-bold text-white">{selectedEdge.distance} m</span></div>
            <div><span className="text-slate-500">Base Time:</span> <span className="font-mono text-white">{selectedEdge.travel_time} s</span></div>
            <div><span className="text-slate-500">Congestion:</span> <span className="font-mono font-bold text-amber-400">{Math.round(selectedEdge.congestion * 100)}%</span></div>
            <div><span className="text-slate-500">Dynamic Cost:</span> <span className="font-mono text-cyan-300">{(selectedEdge.distance * (1 + 4 * selectedEdge.congestion ** 2)).toFixed(1)}</span></div>
          </div>
        </div>
      )}

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="font-bold text-cyan-400 text-sm border-b border-slate-800 pb-1.5">
            Station Node: {selectedNode.name} ({selectedNode.id})
          </div>
          <div className="text-slate-300">
            <div>Type: <span className="font-semibold text-white uppercase">{selectedNode.type}</span></div>
            <div>3D Position: <span className="font-mono text-slate-400">X: {selectedNode.pos.x}, Y: {selectedNode.pos.y || 0}, Z: {selectedNode.pos.z || 0}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
