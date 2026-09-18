import React from 'react';
import { Html } from '@react-three/drei';
import type { FactoryNode } from '../../types/smartagv';

interface StorageArea3DProps {
  node: FactoryNode;
  onSelectNode: (nodeId: string) => void;
}

export const StorageArea3D: React.FC<StorageArea3DProps> = ({ node, onSelectNode }) => {
  const x = node.pos.x;
  const z = node.pos.z || 0;

  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelectNode(node.id);
      }}
    >
      {/* Ground Station Base Pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[7, 0.1, 7]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
      </mesh>

      {/* Storage Racks (3 Vertical Shelves) */}
      {[-2, 2].map((xOffset, i) => (
        <group key={i} position={[xOffset, 2.5, 0]}>
          {/* Rack Pillars */}
          {[-1.5, 1.5].map((zOff, zi) => (
            <mesh key={zi} position={[0, 0, zOff]}>
              <boxGeometry args={[0.3, 5, 0.3]} />
              <meshStandardMaterial color="#0284c7" metalness={0.8} />
            </mesh>
          ))}

          {/* Shelves */}
          {[1, 2.8, 4.5].map((yHeight, yi) => (
            <mesh key={yi} position={[0, yHeight - 2.5, 0]}>
              <boxGeometry args={[2.5, 0.15, 3.5]} />
              <meshStandardMaterial color="#334155" metalness={0.6} />
            </mesh>
          ))}

          {/* Cargo Boxes on Shelves */}
          <mesh position={[0, -0.8, 0]}>
            <boxGeometry args={[1.8, 1.0, 2.2]} />
            <meshStandardMaterial color="#d97706" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[1.5, 0.9, 1.8]} />
            <meshStandardMaterial color="#0284c7" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Floating 3D Station Label */}
      <Html position={[0, 5.8, 0]} center distanceFactor={25}>
        <div className="bg-blue-950/90 text-blue-200 border border-blue-700/80 px-2.5 py-1 rounded-lg font-bold text-xs shadow-xl font-sans tracking-wide">
          📦 {node.name}
        </div>
      </Html>
    </group>
  );
};
