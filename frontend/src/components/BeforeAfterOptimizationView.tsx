import React from 'react';
import type { BeforeAfterDiff } from '../types/smartagv';
import { RefreshCw } from 'lucide-react';

interface BeforeAfterProps {
  diffs: BeforeAfterDiff[];
}

export const BeforeAfterOptimizationView: React.FC<BeforeAfterProps> = ({ diffs }) => {
  if (!diffs || diffs.length === 0) {
    return (
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 backdrop-blur-md text-slate-400 text-center text-xs">
        <RefreshCw className="w-6 h-6 text-slate-600 mx-auto mb-2" />
        No recent dynamic re-optimization diffs recorded. Trigger an event (Failure, Congestion, Urgent Task) to see Before vs After state changes.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Before vs After Dynamic Re-Optimization Audit View
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">Recent Diffs ({diffs.length})</span>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
        {diffs.map((diff, idx) => (
          <div key={idx} className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-cyan-400 font-mono text-sm">{diff.task_id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/60">
                  Reason: {diff.reason}
                </span>
              </div>
              <span className="text-slate-400 text-[10px] font-mono">{diff.timestamp}</span>
            </div>

            {/* Before vs After Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before State */}
              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg space-y-1.5">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                  BEFORE RE-OPTIMIZATION
                </span>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Assigned AGV:</span>
                  <span className="font-semibold text-red-300">{diff.previous_agv || 'None / Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Route Distance:</span>
                  <span className="font-mono">{diff.previous_distance ? `${diff.previous_distance.toFixed(1)}m` : 'N/A'}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  <span>Route:</span> <span className="font-mono text-slate-300">{diff.previous_route.length > 0 ? diff.previous_route.join(' → ') : 'None'}</span>
                </div>
              </div>

              {/* After State */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  AFTER RE-OPTIMIZATION
                </span>
                <div className="flex items-center justify-between text-slate-300">
                  <span>New Assigned AGV:</span>
                  <span className="font-semibold text-emerald-300">{diff.new_agv || 'None'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>New Distance:</span>
                  <span className="font-mono">{diff.new_distance.toFixed(1)}m</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  <span>New Route:</span> <span className="font-mono text-cyan-300">{diff.new_route.join(' → ')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
