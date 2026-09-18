import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { FactoryNode } from '../../types/smartagv';
import * as THREE from 'three';

interface Machine3DProps {
  node: FactoryNode;
  onSelectNode: (nodeId: string) => void;
}

export const Machine3D: React.FC<Machine3DProps> = ({ node, onSelectNode }) => {
  const x = node.pos.x;
  const z = node.pos.z || 0;
  const isProduction = node.type === 'production';

  const armRef = useRef<THREE.Mesh>(null);

  // Rotate robotic arm slightly for dynamic visual effect
  useFrame((state) => {
    if (armRef.current) {
      armRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.4;
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
      {/* Station Ground Pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[7, 0.1, 7]} />
        <meshStandardMaterial color={isProduction ? "#064e3b" : "#581c87"} roughness={0.4} />
      </mesh>

      {/* Main Machine Body */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 3.4, 4.5]} />
        <meshStandardMaterial color={isProduction ? "#047857" : "#7e22ce"} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Machine Glass Door Panel */}
      <mesh position={[0, 2.0, 2.3]}>
        <boxGeometry args={[3.2, 2.0, 0.1]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.5} />
      </mesh>

      {/* Robotic Arm Mount on Top */}
      <mesh ref={armRef} position={[0, 3.8, 0]}>
        <boxGeometry args={[0.6, 1.2, 0.6]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} />
      </mesh>

      {/* Status Warning Beacon */}
      <mesh position={[1.8, 3.7, -1.8]}>
        <cylinderGeometry args={[0.15, 0.15, 0.6, 16]} />
        <meshStandardMaterial
          color={isProduction ? "#10b981" : "#a855f7"}
          emissive={isProduction ? "#10b981" : "#a855f7"}
          emissiveIntensity={1.0}
        />
      </mesh>

      {/* Floating Station Label */}
      <Html position={[0, 5.8, 0]} center distanceFactor={25}>
        <div className={`px-2.5 py-1 rounded-lg font-bold text-xs shadow-xl font-sans tracking-wide border ${
          isProduction
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/80'
            : 'bg-purple-950/90 text-purple-200 border-purple-700/80'
        }`}>
          {isProduction ? '🏭' : '⚙️'} {node.name}
        </div>
      </Html>
    </group>
  );
};
