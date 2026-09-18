import React from 'react';
import { Layers } from 'lucide-react';

export const Legend3D: React.FC = () => {
  return (
    <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md text-[11px] text-slate-300 pointer-events-auto max-w-[220px]">
      <div className="flex items-center gap-1.5 font-bold text-white mb-2 pb-1 border-b border-slate-800">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span>3D Factory Visual Legend</span>
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">AGV Status</div>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Busy / Active</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Charging</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Offline / Fail</span>
        </div>

        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pt-1.5 border-t border-slate-800/80">Route Status</div>
        <div className="space-y-1 text-[10px]">
          <span className="flex items-center gap-1.5"><span className="w-4 h-1 bg-cyan-400 rounded"></span> Active Task Path</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-1 bg-amber-500 rounded"></span> Congested Route (&gt;50%)</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-1 bg-red-600 rounded"></span> Blocked Barricade</span>
        </div>
      </div>
    </div>
  );
};
