import React from 'react';
import type { BeforeAfterDiff } from '../../types/smartagv';
import { RefreshCw, X } from 'lucide-react';

interface ReoptimizationOverlayProps {
  latestDiff: BeforeAfterDiff | null;
  triggerReason?: string;
  onClose: () => void;
}

export const ReoptimizationOverlay: React.FC<ReoptimizationOverlayProps> = ({
  latestDiff,
  triggerReason,
  onClose
}) => {
  if (!latestDiff) return null;

  return (
    <div className="fixed top-20 right-6 z-50 max-w-md w-full animate-bounce-in">
      <div className="bg-slate-900/95 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white font-sans">
        <div className="flex items-center justify-between border-b border-amber-500/40 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                ⚡ RE-OPTIMIZATION TRIGGERED
              </h3>
              <p className="text-[10px] text-slate-300">Reason: <span className="font-semibold text-white">{triggerReason || latestDiff.reason}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diff Details */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">Affected Task:</span>
            <span className="font-mono font-bold text-cyan-400">{latestDiff.task_id}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-red-950/40 border border-red-900/60 rounded-lg">
              <span className="text-red-400 font-bold block mb-1">Previous Assignment</span>
              <div className="text-slate-300">AGV: <span className="font-semibold">{latestDiff.previous_agv || 'None'}</span></div>
              <div className="text-slate-400 text-[10px] truncate">
                Route: {latestDiff.previous_route.length > 0 ? latestDiff.previous_route.join('→') : 'N/A'}
              </div>
            </div>

            <div className="p-2 bg-emerald-950/40 border border-emerald-900/60 rounded-lg">
              <span className="text-emerald-400 font-bold block mb-1">New Reassignment</span>
              <div className="text-slate-300">AGV: <span className="font-semibold text-emerald-300">{latestDiff.new_agv || 'None'}</span></div>
              <div className="text-slate-300 text-[10px] truncate">
                New Route: <span className="text-cyan-300">{latestDiff.new_route.join('→')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
