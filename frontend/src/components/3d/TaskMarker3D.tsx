import React from 'react';
import { Html } from '@react-three/drei';
import type { Task, FactoryNode } from '../../types/smartagv';

interface TaskMarker3DProps {
  task: Task;
  nodes: FactoryNode[];
  onSelectTask?: (taskId: string) => void;
}

export const TaskMarker3D: React.FC<TaskMarker3DProps> = ({ task, nodes, onSelectTask }) => {
  const nodeMap = new Map<string, FactoryNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const srcNode = nodeMap.get(task.source);

  if (!srcNode || task.status === 'completed') return null;

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'URGENT': return '#ef4444'; // Red
      case 'HIGH': return '#f59e0b';   // Amber
      default: return '#3b82f6';       // Blue
    }
  };

  const srcX = srcNode.pos.x, srcZ = srcNode.pos.z || 0;

  return (
    <group
      position={[srcX, 0, srcZ]}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelectTask) onSelectTask(task.id);
      }}
    >
      {/* Task Source Beacon Beam */}
      <mesh position={[0, 4.0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 8.0, 16]} />
        <meshBasicMaterial
          color={getPriorityColor()}
          transparent
          opacity={task.priority === 'URGENT' ? 0.8 : 0.4}
        />
      </mesh>

      {/* Floating 3D Task Badge */}
      <Html position={[0, 7.5, 0]} center distanceFactor={25}>
        <div className={`px-2.5 py-1 rounded-lg font-bold text-xs shadow-2xl font-sans tracking-wide flex items-center gap-1.5 border ${
          task.priority === 'URGENT'
            ? 'bg-red-950/90 text-red-200 border-red-700 animate-pulse'
            : task.priority === 'HIGH'
            ? 'bg-amber-950/90 text-amber-200 border-amber-700'
            : 'bg-blue-950/90 text-blue-200 border-blue-700'
        }`}>
          <span>📦 {task.id}</span>
          <span className="text-[10px] opacity-80">({task.material})</span>
        </div>
      </Html>
    </group>
  );
};
