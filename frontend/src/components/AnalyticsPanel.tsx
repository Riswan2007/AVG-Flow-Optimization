import React from 'react';
import type { SimulationMetrics } from '../types/smartagv';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BarChart3, TrendingUp, RefreshCw, Zap } from 'lucide-react';

interface AnalyticsProps {
  metrics: SimulationMetrics | null;
}

export const AnalyticsPanel: React.FC<AnalyticsProps> = ({ metrics }) => {
  if (!metrics) return null;

  const agvData = Object.entries(metrics.agv_utilization || {}).map(([id, util]) => ({
    agv: id,
    utilization: Math.round(util)
  }));

  const taskData = [
    { name: 'Completed', value: metrics.completed_tasks, color: '#10b981' },
    { name: 'Active', value: metrics.active_tasks, color: '#06b6d4' },
    { name: 'Pending', value: metrics.pending_tasks, color: '#f59e0b' }
  ];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            System Analytics & Performance Metrics
          </h2>
        </div>
        <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Simulation Metrics
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Summary Cards */}
        <div className="space-y-3">
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Avg Travel Distance</span>
              <span className="text-xl font-bold text-cyan-300 font-mono">{metrics.average_travel_distance} m</span>
            </div>
            <TrendingUp className="w-6 h-6 text-cyan-400 opacity-80" />
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Avg Task Completion Time</span>
              <span className="text-xl font-bold text-emerald-300 font-mono">~{metrics.average_completion_time} s</span>
            </div>
            <Zap className="w-6 h-6 text-emerald-400 opacity-80" />
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Dynamic Reassignments</span>
              <span className="text-xl font-bold text-amber-300 font-mono">{metrics.dynamic_reassignments} events</span>
            </div>
            <RefreshCw className="w-6 h-6 text-amber-400 opacity-80" />
          </div>
        </div>

        {/* AGV Fleet Utilization Bar Chart */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            AGV Fleet Utilization (%)
          </span>
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agvData}>
                <XAxis dataKey="agv" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="utilization" radius={[4, 4, 0, 0]}>
                  {agvData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.utilization > 70 ? '#06b6d4' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Completion Breakdown Pie Chart */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            Task Completion Status
          </span>
          <div className="w-full h-40 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskData}
                  cx="50%" cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-around text-[11px] text-slate-400 border-t border-slate-800 pt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed: {metrics.completed_tasks}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Active: {metrics.active_tasks}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending: {metrics.pending_tasks}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
