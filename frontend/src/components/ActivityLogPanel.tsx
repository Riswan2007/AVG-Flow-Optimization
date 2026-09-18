import React from 'react';
import type { ActivityLog } from '../types/smartagv';
import { Terminal, ShieldAlert, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface ActivityLogProps {
  logs: ActivityLog[];
}

export const ActivityLogPanel: React.FC<ActivityLogProps> = ({ logs }) => {
  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'error':
        return { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-950/40 border-red-900/60' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-900/60' };
      case 'success':
        return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-900/60' };
      default:
        return { icon: Info, color: 'text-cyan-400', bg: 'bg-slate-950/60 border-slate-800' };
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Real-Time System Activity & Re-Optimization Log
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">Live Audit Stream</span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 font-mono text-xs">
        {logs.map((log) => {
          const style = getLevelStyle(log.level);
          const IconComp = style.icon;
          return (
            <div
              key={log.id}
              className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-all ${style.bg}`}
            >
              <IconComp className={`w-4 h-4 ${style.color} shrink-0 mt-0.5`} />
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                  <span className="font-bold uppercase tracking-wider text-slate-300">[{log.event_type}]</span>
                  <span>{log.timestamp}</span>
                </div>
                <p className="text-slate-200 text-xs font-sans leading-relaxed">{log.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
