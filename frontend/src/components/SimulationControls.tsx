import React from 'react';
import type { SimulationState } from '../types/smartagv';
import { Play, Pause, RotateCcw, FastForward, Sliders } from 'lucide-react';

interface SimulationControlsProps {
  state: SimulationState;
  onControl: (action: string, speed?: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({ state, onControl }) => {
  const speeds = [1.0, 2.0, 5.0, 10.0];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-cyan-400">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            Simulation Control Engine
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider ${
              state.is_running ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {state.status}
            </span>
          </div>
          <p className="text-xs text-slate-400">Control tick progression rate & reset factory state</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Play / Pause Toggle */}
        <button
          onClick={() => onControl(state.is_running ? 'pause' : 'start')}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
            state.is_running
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
          }`}
        >
          {state.is_running ? (
            <>
              <Pause className="w-4 h-4" /> Pause Simulation
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Start Simulation
            </>
          )}
        </button>

        {/* Speed Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 px-2 text-[11px] font-medium flex items-center gap-1">
            <FastForward className="w-3.5 h-3.5 text-cyan-400" /> Speed:
          </span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onControl('set_speed', s)}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                state.speed === s
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Reset Button */}
        <button
          onClick={() => onControl('reset')}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Factory
        </button>
      </div>
    </div>
  );
};
