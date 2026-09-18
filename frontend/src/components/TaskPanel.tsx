import React, { useState } from 'react';
import type { Task, TaskPriority } from '../types/smartagv';
import { Package, Plus, AlertTriangle, ArrowRight } from 'lucide-react';

interface TaskPanelProps {
  tasks: Task[];
  selectedTaskId?: string | null;
  onSelectTask: (taskId: string) => void;
  onCreateTask: (payload: { source: string; destination: string; material: string; quantity: number; priority: string }) => void;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onCreateTask
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [source, setSource] = useState('Storage-A');
  const [destination, setDestination] = useState('Machine-01');
  const [material, setMaterial] = useState('Steel Plates');
  const [quantity, setQuantity] = useState(100);
  const [priority, setPriority] = useState<TaskPriority>('NORMAL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTask({ source, destination, material, quantity: Number(quantity), priority });
    setIsModalOpen(false);
  };

  const getPriorityBadge = (prio: TaskPriority) => {
    switch (prio) {
      case 'URGENT':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-red-950 text-red-400 border border-red-800 rounded-full flex items-center gap-1 animate-pulse shadow-lg shadow-red-950/50">
            <AlertTriangle className="w-3 h-3 text-red-400" /> URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 rounded-full">
            HIGH
          </span>
        );
      case 'NORMAL':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800 rounded-full">
            NORMAL
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40 rounded-full">Pending</span>;
      case 'assigned':
      case 'in_progress':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 rounded-full">In Transit</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 rounded-full">Completed</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-400 rounded-full">{status}</span>;
    }
  };

  const locationOptions = [
    'Storage-A', 'Storage-B', 'Storage-C',
    'Machine-01', 'Machine-02', 'Machine-03',
    'Prod-01', 'Prod-02'
  ];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-wide">Material Transport Tasks</h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-lg shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create New Task
        </button>
      </div>

      {/* Task List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-950/60">
              <th className="py-2.5 px-3">Task ID</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Material & Qty</th>
              <th className="py-2.5 px-3">Route (From → To)</th>
              <th className="py-2.5 px-3">Assigned AGV</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tasks.map((t) => {
              const isSelected = selectedTaskId === t.id;
              return (
                <tr
                  key={t.id}
                  onClick={() => onSelectTask(t.id)}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 text-white font-medium'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{t.id}</td>
                  <td className="py-2.5 px-3">{getPriorityBadge(t.priority)}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">{t.material}</div>
                    <div className="text-[10px] text-slate-400">{t.quantity} kg</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1 text-slate-200">
                      <span>{t.source}</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                      <span>{t.destination}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    {t.assigned_agv ? (
                      <span className="font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                        {t.assigned_agv}
                      </span>
                    ) : (
                      <span className="text-red-400 text-[10px] italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">{getStatusBadge(t.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Create Material Transport Demand</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Source Location</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none"
                >
                  {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Destination Location</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none"
                >
                  {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Material Description</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Quantity (kg)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none"
                  min="10" max="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT (Triggers High-Score Optimization)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-md transition-all"
                >
                  Submit & Optimize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
