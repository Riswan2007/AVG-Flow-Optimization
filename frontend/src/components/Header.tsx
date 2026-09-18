import React from 'react';
import { Activity, Clock, Cpu, RefreshCw, Zap } from 'lucide-react';

interface HeaderProps {
  systemStatus: string;
  simTime: number;
  lastOptTime: string;
  isOptimizing: boolean;
  onManualOptimize: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  simTime,
  lastOptTime,
  isOptimizing,
  onManualOptimize
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
          <Cpu className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
              SmartAGV
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> Dynamic Engine v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Dynamic Factory Material Movement Optimization System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* System Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Status:</span>
          <span className="font-semibold text-emerald-400 uppercase tracking-wider">{systemStatus}</span>
        </div>

        {/* Simulation Time Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">Sim Clock:</span>
          <span className="font-mono font-semibold text-cyan-300 text-sm">{formatTime(simTime)}</span>
        </div>

        {/* Last Optimization Timestamp */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
          <RefreshCw className={`w-4 h-4 text-amber-400 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span className="text-slate-400">Last Opt:</span>
          <span className="font-mono font-medium text-amber-300">{lastOptTime || 'N/A'}</span>
        </div>

        {/* Re-optimize Button */}
        <button
          onClick={onManualOptimize}
          disabled={isOptimizing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs rounded-lg shadow-md shadow-cyan-900/40 border border-cyan-500/30 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
          Re-Optimize Now
        </button>
      </div>
    </header>
  );
};
