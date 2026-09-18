import React, { useState } from 'react';
import type { FactoryNode, FactoryEdge, AGV, Task } from '../types/smartagv';
import { Layers } from 'lucide-react';

interface FactoryMapProps {
  nodes: FactoryNode[];
  edges: FactoryEdge[];
  agvs: AGV[];
  tasks: Task[];
  selectedAgvId?: string | null;
  selectedTaskId?: string | null;
  onSelectAgv?: (agvId: string) => void;
  onSelectTask?: (taskId: string) => void;
  onEdgeClick?: (source: string, target: string) => void;
}

export const FactoryMap: React.FC<FactoryMapProps> = ({
  nodes,
  edges,
  agvs,
  tasks,
  selectedAgvId,
  selectedTaskId,
  onSelectAgv,
  onSelectTask,
  onEdgeClick
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  // Map nodes by ID for fast position lookup
  const nodeMap = new Map<string, FactoryNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // Compute calculated position for an AGV along its route
  const getAgvCoordinates = (agv: AGV): { x: number; y: number } => {
    if (!agv.current_route || agv.current_route.length < 2) {
      const locNode = nodeMap.get(agv.location);
      return locNode ? { x: locNode.pos.x, y: locNode.pos.y } : { x: 100, y: 100 };
    }

    const idx = Math.min(agv.route_index, agv.current_route.length - 2);
    const uNode = nodeMap.get(agv.current_route[idx]);
    const vNode = nodeMap.get(agv.current_route[idx + 1]);

    if (!uNode || !vNode) {
      const locNode = nodeMap.get(agv.location);
      return locNode ? { x: locNode.pos.x, y: locNode.pos.y } : { x: 100, y: 100 };
    }

    const progress = Math.max(0, Math.min(1, agv.sub_progress || 0.0));
    const x = uNode.pos.x + (vNode.pos.x - uNode.pos.x) * progress;
    const y = uNode.pos.y + (vNode.pos.y - uNode.pos.y) * progress;

    return { x, y };
  };

  // Determine active highlighted route edges
  const activeRouteEdges = new Set<string>();
  if (selectedAgvId) {
    const targetAgv = agvs.find(a => a.id === selectedAgvId);
    if (targetAgv && targetAgv.current_route) {
      for (let i = 0; i < targetAgv.current_route.length - 1; i++) {
        const u = targetAgv.current_route[i];
        const v = targetAgv.current_route[i + 1];
        activeRouteEdges.add(tupleKey(u, v));
      }
    }
  } else if (selectedTaskId) {
    const targetTask = tasks.find(t => t.id === selectedTaskId);
    if (targetTask && targetTask.assigned_route) {
      for (let i = 0; i < targetTask.assigned_route.length - 1; i++) {
        const u = targetTask.assigned_route[i];
        const v = targetTask.assigned_route[i + 1];
        activeRouteEdges.add(tupleKey(u, v));
      }
    }
  }

  function tupleKey(u: string, v: string) {
    return [u, v].sort().join('::');
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'storage': return { bg: 'fill-blue-950', border: 'stroke-blue-500', text: 'text-blue-400' };
      case 'machine': return { bg: 'fill-purple-950', border: 'stroke-purple-500', text: 'text-purple-400' };
      case 'production': return { bg: 'fill-emerald-950', border: 'stroke-emerald-500', text: 'text-emerald-400' };
      case 'charging': return { bg: 'fill-amber-950', border: 'stroke-amber-500', text: 'text-amber-400' };
      default: return { bg: 'fill-slate-900', border: 'stroke-slate-600', text: 'text-slate-400' };
    }
  };

  const getAgvStatusColor = (status: string) => {
    switch (status) {
      case 'available': return { bg: 'bg-emerald-500', ring: '#10b981' };
      case 'busy': return { bg: 'bg-cyan-500', ring: '#06b6d4' };
      case 'charging': return { bg: 'bg-amber-500', ring: '#f59e0b' };
      case 'offline': return { bg: 'bg-red-500', ring: '#ef4444' };
      default: return { bg: 'bg-slate-500', ring: '#64748b' };
    }
  };

  return (
    <div className="relative bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-4 overflow-hidden">
      {/* Map Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Interactive 2D Factory Topology Map
          </h2>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Storage</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Machines</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Production</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Charging</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-1 bg-amber-500"></span> Congested Route</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-1 bg-red-600"></span> Blocked Route</span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full aspect-[10/6] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
        {/* Subtle SVG Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <defs>
            <pattern id="factoryGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#factoryGrid)" />
        </svg>

        <svg viewBox="0 0 1000 620" className="w-full h-full">
          {/* Render Edges / Roads */}
          {edges.map((edge) => {
            const u = nodeMap.get(edge.source);
            const v = nodeMap.get(edge.target);
            if (!u || !v) return null;

            const key = tupleKey(edge.source, edge.target);
            const isActive = activeRouteEdges.has(key);
            const isHovered = hoveredEdge === key;

            let strokeColor = '#334155'; // default slate road
            let strokeWidth = 5;
            let strokeDash = 'none';

            if (edge.blocked) {
              strokeColor = '#ef4444'; // Red blocked
              strokeWidth = 6;
              strokeDash = '8,4';
            } else if (edge.congestion > 0.5) {
              strokeColor = '#f59e0b'; // Amber congested
              strokeWidth = 7;
              strokeDash = '12,6';
            } else if (isActive) {
              strokeColor = '#06b6d4'; // Cyan active path
              strokeWidth = 8;
            } else if (isHovered) {
              strokeColor = '#94a3b8';
            }

            const midX = (u.pos.x + v.pos.x) / 2;
            const midY = (u.pos.y + v.pos.y) / 2;

            return (
              <g
                key={key}
                className="cursor-pointer transition-all duration-300"
                onClick={() => onEdgeClick && onEdgeClick(edge.source, edge.target)}
                onMouseEnter={() => setHoveredEdge(key)}
                onMouseLeave={() => setHoveredEdge(null)}
              >
                {/* Underglow for active route */}
                {isActive && (
                  <line
                    x1={u.pos.x} y1={u.pos.y}
                    x2={v.pos.x} y2={v.pos.y}
                    stroke="#06b6d4"
                    strokeWidth={14}
                    strokeOpacity={0.3}
                    strokeLinecap="round"
                  />
                )}

                <line
                  x1={u.pos.x} y1={u.pos.y}
                  x2={v.pos.x} y2={v.pos.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  className={edge.congestion > 0.5 ? 'animate-pulse' : ''}
                />

                {/* Edge Status Badges (Congestion % or Blocked) */}
                {(edge.congestion > 0.3 || edge.blocked) && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-24" y="-12"
                      width="48" height="24"
                      rx="6"
                      fill={edge.blocked ? '#991b1b' : '#78350f'}
                      stroke={edge.blocked ? '#f87171' : '#fbbf24'}
                      strokeWidth="1.5"
                    />
                    <text
                      x="0" y="4"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {edge.blocked ? 'BLOCKED' : `${Math.round(edge.congestion * 100)}%`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Render Factory Nodes / Stations */}
          {nodes.map((node) => {
            const colors = getNodeColor(node.type);
            const isHovered = hoveredNode === node.id;
            const isIntersection = node.type === 'intersection';

            return (
              <g
                key={node.id}
                transform={`translate(${node.pos.x}, ${node.pos.y})`}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  const matchingTask = tasks.find(t => t.source === node.id || t.destination === node.id);
                  if (matchingTask && onSelectTask) onSelectTask(matchingTask.id);
                }}
              >
                {isIntersection ? (
                  /* Intersection Node */
                  <circle
                    r={isHovered ? "10" : "8"}
                    className="fill-slate-800 stroke-slate-600 transition-all group-hover:stroke-cyan-400"
                    strokeWidth="2"
                  />
                ) : (
                  /* Main Station Node */
                  <g>
                    <rect
                      x="-45" y="-22"
                      width="90" height="44"
                      rx="10"
                      className={`${colors.bg} ${colors.border} ${isHovered ? 'scale-110 stroke-cyan-400' : ''} transition-all duration-300 shadow-xl`}
                      strokeWidth="2.5"
                    />
                    <text
                      x="0" y="4"
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="11"
                      fontWeight="700"
                      className="pointer-events-none tracking-tight"
                    >
                      {node.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Render Animated AGVs Moving along routes */}
          {agvs.map((agv) => {
            const coords = getAgvCoordinates(agv);
            const statusStyle = getAgvStatusColor(agv.status);
            const isSelected = selectedAgvId === agv.id;

            return (
              <g
                key={agv.id}
                transform={`translate(${coords.x}, ${coords.y})`}
                className="cursor-pointer transition-all duration-500 ease-linear"
                onClick={() => onSelectAgv && onSelectAgv(agv.id)}
              >
                {/* Selection pulse ring */}
                {isSelected && (
                  <circle
                    r="26"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* AGV Circle Badge */}
                <circle
                  r="18"
                  fill="#0f172a"
                  stroke={statusStyle.ring}
                  strokeWidth="3"
                  className="shadow-2xl"
                />

                {/* Battery level ring indicator */}
                <circle
                  r="14"
                  fill="none"
                  stroke={agv.battery > 50 ? '#10b981' : agv.battery > 20 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="2"
                  strokeDasharray={`${(agv.battery / 100) * 88}, 88`}
                  transform="rotate(-90)"
                />

                {/* AGV Truck Icon */}
                <text
                  x="0" y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {agv.id.replace('AGV-', '')}
                </text>

                {/* Status Indicator Dot */}
                <circle
                  cx="12" cy="-12"
                  r="5"
                  className={statusStyle.bg}
                  stroke="#090d16"
                  strokeWidth="1.5"
                />

                {/* Hover / Floating AGV ID Badge */}
                <g transform="translate(0, -28)">
                  <rect
                    x="-30" y="-12"
                    width="60" height="18"
                    rx="4"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text
                    x="0" y="0"
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="9"
                    fontWeight="600"
                  >
                    {agv.id} ({Math.round(agv.battery)}%)
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
