import React, { useState } from 'react';
import { ShieldAlert, Zap, AlertTriangle, Lock, Unlock, Flame } from 'lucide-react';

interface DynamicEventPanelProps {
  onSimulateAGVFailure: () => void;
  onCreateUrgentTask: () => void;
  onSimulateCongestion: (source: string, target: string, congestion: number) => void;
  onSimulateBatteryDrain: () => void;
  onBlockRoute: (source: string, target: string, blocked: boolean) => void;
}

export const DynamicEventPanel: React.FC<DynamicEventPanelProps> = ({
  onSimulateAGVFailure,
  onCreateUrgentTask,
  onSimulateCongestion,
  onSimulateBatteryDrain,
  onBlockRoute
}) => {
  const [isRouteBlocked, setIsRouteBlocked] = useState(false);
  const congestionLevel = 0.9;

  const handleToggleBlockRoute = () => {
    const nextState = !isRouteBlocked;
    setIsRouteBlocked(nextState);
    onBlockRoute('N1', 'N2', nextState);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Interactive Hackathon Demo Events
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
          Live Injections
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Event 1: AGV Failure */}
        <button
          onClick={onSimulateAGVFailure}
          className="p-3 bg-gradient-to-br from-red-950/80 to-slate-900 border border-red-700/60 hover:border-red-500 rounded-xl text-left transition-all hover:scale-[1.02] shadow-md shadow-red-950/40 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-red-400 group-hover:text-red-300">Event 1</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-sm font-bold text-white mb-1">Simulate AGV Failure</div>
          <p className="text-[10px] text-slate-400">Sets active AGV to OFFLINE and triggers instant task reassignment.</p>
        </button>

        {/* Event 2: Urgent Task */}
        <button
          onClick={onCreateUrgentTask}
          className="p-3 bg-gradient-to-br from-amber-950/80 to-slate-900 border border-amber-700/60 hover:border-amber-500 rounded-xl text-left transition-all hover:scale-[1.02] shadow-md shadow-amber-950/40 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-amber-400 group-hover:text-amber-300">Event 2</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white mb-1">Create Urgent Task</div>
          <p className="text-[10px] text-slate-400">Injects URGENT task; re-evaluates priority scoring across fleet.</p>
        </button>

        {/* Event 3: Route Congestion */}
        <button
          onClick={() => onSimulateCongestion('N2', 'N4', congestionLevel)}
          className="p-3 bg-gradient-to-br from-orange-950/80 to-slate-900 border border-orange-700/60 hover:border-orange-500 rounded-xl text-left transition-all hover:scale-[1.02] shadow-md shadow-orange-950/40 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-orange-400 group-hover:text-orange-300">Event 3</span>
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-sm font-bold text-white mb-1">Simulate Congestion</div>
          <p className="text-[10px] text-slate-400">Spikes route N2-N4 congestion to 90%; triggers A* rerouting.</p>
        </button>

        {/* Event 4: Battery Drain */}
        <button
          onClick={onSimulateBatteryDrain}
          className="p-3 bg-gradient-to-br from-purple-950/80 to-slate-900 border border-purple-700/60 hover:border-purple-500 rounded-xl text-left transition-all hover:scale-[1.02] shadow-md shadow-purple-950/40 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-purple-400 group-hover:text-purple-300">Event 4</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white mb-1">Simulate Battery Drain</div>
          <p className="text-[10px] text-slate-400">Drains AGV battery -50%; enforces safety buffer threshold.</p>
        </button>

        {/* Event 5: Block Route */}
        <button
          onClick={handleToggleBlockRoute}
          className={`p-3 bg-gradient-to-br transition-all hover:scale-[1.02] rounded-xl text-left shadow-md group cursor-pointer border ${
            isRouteBlocked
              ? 'from-red-900/90 to-slate-900 border-red-500 text-red-200'
              : 'from-blue-950/80 to-slate-900 border-cyan-700/60 hover:border-cyan-500'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-cyan-400 group-hover:text-cyan-300">Event 5</span>
            {isRouteBlocked ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4 text-cyan-400" />}
          </div>
          <div className="text-sm font-bold text-white mb-1">
            {isRouteBlocked ? 'Unblock Route N1-N2' : 'Block Route N1-N2'}
          </div>
          <p className="text-[10px] text-slate-400">
            {isRouteBlocked ? 'Restores edge N1-N2 traffic flow.' : 'Forces Dijkstra engine to bypass edge N1-N2 completely.'}
          </p>
        </button>
      </div>
    </div>
  );
};
