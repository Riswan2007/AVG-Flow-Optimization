import React from 'react';
import { Html } from '@react-three/drei';
import type { TaskAssignmentDetail, FactoryNode } from '../../types/smartagv';
import * as THREE from 'three';

interface ExplainMode3DProps {
  assignmentDetail: TaskAssignmentDetail | null;
  nodes: FactoryNode[];
}

export const ExplainMode3D: React.FC<ExplainMode3DProps> = ({ assignmentDetail, nodes }) => {
  if (!assignmentDetail) return null;

  const nodeMap = new Map<string, FactoryNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const candidateMap = new Map();
  assignmentDetail.candidates.forEach(c => candidateMap.set(c.agv_id, c));

  return (
    <group>
      {/* Semi-transparent Dimming Backdrop Shield */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[120, 80]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating Explain Summary Card on 3D Viewport */}
      <Html position={[0, 15, -20]} center distanceFactor={25}>
        <div className="bg-slate-900/95 border-2 border-cyan-500 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-lg font-sans">
          <div className="flex items-center justify-between border-b border-cyan-500/40 pb-2 mb-2.5">
            <span className="font-extrabold text-xs text-cyan-400 uppercase tracking-wider">
              🔍 EXPLAIN CURRENT OPTIMIZATION MODE
            </span>
            <span className="font-mono text-[10px] font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              Task: {assignmentDetail.task_id} ({assignmentDetail.priority})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SELECTED AGV:</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {assignmentDetail.assigned_agv || 'None'}
              </span>
              {assignmentDetail.selected_candidate && (
                <div className="text-[10px] text-emerald-300 mt-0.5">
                  Score: {assignmentDetail.selected_candidate.total_score.toFixed(1)} / 100
                </div>
              )}
            </div>

            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">OPTIMAL ROUTE:</span>
              <div className="font-mono text-cyan-300 text-[10px] truncate">
                {assignmentDetail.assigned_route.join(' → ')}
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};
