import React from 'react';
import type { AGV, Task, FactoryEdge } from '../types/smartagv';
import { Truck, BatteryCharging, AlertTriangle, Activity, PackageCheck } from 'lucide-react';

interface KPICardsProps {
  agvs: AGV[];
  tasks: Task[];
  edges: FactoryEdge[];
}

export const KPICards: React.FC<KPICardsProps> = ({ agvs, tasks, edges }) => {
  const totalAgvs = agvs.length;
  const availableAgvs = agvs.filter(a => a.status === 'available').length;
  const busyAgvs = agvs.filter(a => a.status === 'busy').length;
  const offlineAgvs = agvs.filter(a => a.status === 'offline').length;
  const chargingAgvs = agvs.filter(a => a.status === 'charging').length;

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const activeTasks = tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  const avgBattery = agvs.length > 0 
    ? Math.round(agvs.reduce((acc, a) => acc + a.battery, 0) / agvs.length)
    : 0;

  const congestedRoutesCount = edges.filter(e => e.congestion > 0.5 || e.blocked).length;

  const cards = [
    {
      title: 'AGV Fleet Status',
      value: totalAgvs,
      subtitle: `${availableAgvs} Available · ${busyAgvs} Busy · ${chargingAgvs} Charge · ${offlineAgvs} Offline`,
      icon: Truck,
      color: 'from-blue-600/20 to-cyan-600/20',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-cyan-400',
      badge: `${availableAgvs} Ready`,
      badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
    },
    {
      title: 'Active Transport Tasks',
      value: activeTasks,
      subtitle: `${pendingTasks} Pending Queue · ${completedTasks} Completed`,
      icon: Activity,
      color: 'from-amber-600/20 to-orange-600/20',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      badge: `${pendingTasks} Pending`,
      badgeColor: 'bg-amber-950 text-amber-400 border-amber-800/60'
    },
    {
      title: 'Completed Transport',
      value: completedTasks,
      subtitle: 'Successfully Delivered Materials',
      icon: PackageCheck,
      color: 'from-emerald-600/20 to-teal-600/20',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      badge: 'Completed',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
    },
    {
      title: 'Fleet Average Battery',
      value: `${avgBattery}%`,
      subtitle: agvs.some(a => a.battery < 20) ? 'Alert: AGVs low battery' : 'Optimal battery reserves',
      icon: BatteryCharging,
      color: avgBattery < 40 ? 'from-red-600/20 to-orange-600/20' : 'from-purple-600/20 to-indigo-600/20',
      borderColor: avgBattery < 40 ? 'border-red-500/30' : 'border-purple-500/30',
      iconColor: avgBattery < 40 ? 'text-red-400' : 'text-purple-400',
      badge: avgBattery < 40 ? 'Low Battery' : 'Healthy',
      badgeColor: avgBattery < 40 ? 'bg-red-950 text-red-400 border-red-800/60' : 'bg-purple-950 text-purple-300 border-purple-800/60'
    },
    {
      title: 'Congested / Blocked Routes',
      value: congestedRoutesCount,
      subtitle: congestedRoutesCount > 0 ? 'Dynamic Rerouting Active' : 'All Routes Clear',
      icon: AlertTriangle,
      color: congestedRoutesCount > 0 ? 'from-amber-600/20 to-red-600/20' : 'from-slate-800/20 to-slate-900/20',
      borderColor: congestedRoutesCount > 0 ? 'border-amber-500/40' : 'border-slate-800',
      iconColor: congestedRoutesCount > 0 ? 'text-amber-400' : 'text-slate-400',
      badge: congestedRoutesCount > 0 ? 'Rerouting' : 'Optimal',
      badgeColor: congestedRoutesCount > 0 ? 'bg-amber-950 text-amber-400 border-amber-800/60' : 'bg-slate-900 text-slate-400 border-slate-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`relative bg-slate-900/80 rounded-xl p-4 border ${card.borderColor} bg-gradient-to-br ${card.color} shadow-lg backdrop-blur-sm transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.title}</span>
              <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
            
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-white tracking-tight">{card.value}</span>
              <IconComponent className={`w-6 h-6 ${card.iconColor} opacity-90`} />
            </div>
            
            <p className="mt-2 text-[11px] text-slate-400 font-medium truncate">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
