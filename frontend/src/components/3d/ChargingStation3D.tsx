import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { FactoryNode } from '../../types/smartagv';
import * as THREE from 'three';

interface ChargingStation3DProps {
  node: FactoryNode;
  onSelectNode: (nodeId: string) => void;
}

export const ChargingStation3D: React.FC<ChargingStation3DProps> = ({ node, onSelectNode }) => {
  const x = node.pos.x;
  const z = node.pos.z || 0;
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.02;
    }
  });

  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelectNode(node.id);
      }}
    >
      {/* Charging Base Pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[4.0, 4.0, 0.1, 32]} />
        <meshStandardMaterial color="#78350f" roughness={0.4} />
      </mesh>

      {/* Glowing Energy Ring */}
      <mesh ref={ringRef} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 3.5, 32]} />
        <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>

      {/* Charging Dock Pillar */}
      <mesh position={[0, 1.8, -2.5]} castShadow>
        <boxGeometry args={[1.5, 3.5, 1.0]} />
        <meshStandardMaterial color="#d97706" metalness={0.7} />
      </mesh>

      {/* Lightning Bolt Icon / Beacon */}
      <mesh position={[0, 4.0, -2.5]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2.0} />
      </mesh>

      {/* Floating Station Label */}
      <Html position={[0, 5.2, 0]} center distanceFactor={25}>
        <div className="bg-amber-950/90 text-amber-200 border border-amber-700/80 px-2.5 py-1 rounded-lg font-bold text-xs shadow-xl font-sans tracking-wide">
          ⚡ {node.name}
        </div>
      </Html>
    </group>
  );
};
