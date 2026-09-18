import React from 'react';
import type { AGV } from '../types/smartagv';
import { Truck, Battery, Zap, ShieldAlert } from 'lucide-react';

interface AGVPanelProps {
  agvs: AGV[];
  selectedAgvId?: string | null;
  onSelectAgv: (agvId: string) => void;
  onDrainBattery: (agvId: string) => void;
  onSimulateFailure: (agvId: string) => void;
}

export const AGVPanel: React.FC<AGVPanelProps> = ({
  agvs,
  selectedAgvId,
  onSelectAgv,
  onDrainBattery,
  onSimulateFailure
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-full">AVAILABLE</span>;
      case 'busy':
        return <span className="px-2.5 py-0.5 text-xs font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded-full animate-pulse">BUSY</span>;
      case 'charging':
        return <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60 rounded-full flex items-center gap-1"><Zap className="w-3 h-3" /> CHARGING</span>;
      case 'offline':
        return <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800/60 rounded-full">OFFLINE</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-700 rounded-full">{status}</span>;
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'bg-emerald-500';
    if (battery > 20) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-wide">AGV Fleet Status & Telemetry</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">Total: {agvs.length} Vehicles</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agvs.map((agv) => {
          const isSelected = selectedAgvId === agv.id;
          return (
            <div
              key={agv.id}
              onClick={() => onSelectAgv(agv.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-base tracking-tight">{agv.id}</span>
                    <span className="text-xs text-slate-400 font-normal">({agv.name})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Location: <span className="text-cyan-300 font-medium">{agv.location}</span></p>
                </div>
                {getStatusBadge(agv.status)}
              </div>

              {/* Battery Meter */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <Battery className="w-3.5 h-3.5 text-slate-400" /> Battery:
                  </span>
                  <span className={`font-mono font-bold ${agv.battery < 20 ? 'text-red-400' : 'text-slate-200'}`}>
                    {Math.round(agv.battery)}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${getBatteryColor(agv.battery)}`}
                    style={{ width: `${Math.max(0, Math.min(100, agv.battery))}%` }}
                  />
                </div>
              </div>

              {/* Telemetry Details */}
              <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>
                  <span>Capacity:</span> <span className="text-slate-200 font-semibold">{agv.capacity} kg</span>
                </div>
                <div>
                  <span>Speed:</span> <span className="text-slate-200 font-semibold">{agv.speed} m/s</span>
                </div>
              </div>

              {/* Current Task & Route */}
              {agv.current_task ? (
                <div className="mt-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <div className="flex items-center justify-between text-cyan-400 font-medium">
                    <span>Task: {agv.current_task}</span>
                    {agv.estimated_completion_time && (
                      <span className="text-slate-400 text-[10px]">~{Math.round(agv.estimated_completion_time)}s</span>
                    )}
                  </div>
                  {agv.current_route && agv.current_route.length > 0 && (
                    <div className="text-[10px] text-slate-400 mt-1 truncate flex items-center gap-1">
                      <span>Route:</span>
                      <span className="text-slate-300 font-mono">{agv.current_route.join(' → ')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/40 text-[11px] text-slate-500 italic">
                  No active transport task
                </div>
              )}

              {/* Quick Interactive Actions */}
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDrainBattery(agv.id);
                  }}
                  className="flex-1 py-1 px-2 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 text-amber-300 text-[10px] font-semibold rounded-md transition-all flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3" /> Drain -50%
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSimulateFailure(agv.id);
                  }}
                  className="flex-1 py-1 px-2 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 text-[10px] font-semibold rounded-md transition-all flex items-center justify-center gap-1"
                >
                  <ShieldAlert className="w-3 h-3" /> Set Offline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
