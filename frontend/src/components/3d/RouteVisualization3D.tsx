import React from 'react';
import { Html } from '@react-three/drei';
import type { FactoryEdge, FactoryNode } from '../../types/smartagv';
import * as THREE from 'three';

interface RouteVisualization3DProps {
  edges: FactoryEdge[];
  nodes: FactoryNode[];
  activeRouteEdges: Set<string>;
  onSelectRoute: (source: string, target: string) => void;
}

export const RouteVisualization3D: React.FC<RouteVisualization3DProps> = ({
  edges,
  nodes,
  activeRouteEdges,
  onSelectRoute
}) => {
  const nodeMap = new Map<string, FactoryNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  function tupleKey(u: string, v: string) {
    return [u, v].sort().join('::');
  }

  return (
    <group>
      {/* Intersection Node Junction Pads */}
      {nodes.map((n) => (
        <mesh
          key={`pad-${n.id}`}
          position={[n.pos.x, 0.022, n.pos.z || 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[5.0, 5.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      ))}

      {edges.map((edge) => {
        const uNode = nodeMap.get(edge.source);
        const vNode = nodeMap.get(edge.target);
        if (!uNode || !vNode) return null;

        const uX = uNode.pos.x, uZ = uNode.pos.z || 0;
        const vX = vNode.pos.x, vZ = vNode.pos.z || 0;

        const midX = (uX + vX) / 2;
        const midZ = (uZ + vZ) / 2;

        const dx = vX - uX;
        const dz = vZ - uZ;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angleY = Math.atan2(dx, dz);

        const key = tupleKey(edge.source, edge.target);
        const isActive = activeRouteEdges.has(key);
        const isCongested = edge.congestion > 0.5;
        const isBlocked = edge.blocked;

        return (
          <group
            key={key}
            onClick={(e) => {
              e.stopPropagation();
              onSelectRoute(edge.source, edge.target);
            }}
          >
            {/* Base Industrial Asphalt Road Strip (Width = 4.2) */}
            <mesh
              position={[midX, 0.02, midZ]}
              rotation={[-Math.PI / 2, 0, angleY - Math.PI / 2]}
              receiveShadow
            >
              <planeGeometry args={[length, 4.2]} />
              <meshStandardMaterial
                color={isBlocked ? "#3f0707" : isCongested ? "#451a03" : "#0f172a"}
                roughness={0.8}
              />
            </mesh>

            {/* Road White Dashed Centerline */}
            <mesh
              position={[midX, 0.03, midZ]}
              rotation={[-Math.PI / 2, 0, angleY - Math.PI / 2]}
            >
              <planeGeometry args={[length, 0.25]} />
              <meshBasicMaterial
                color={isBlocked ? "#ef4444" : isCongested ? "#f59e0b" : "#e2e8f0"}
              />
            </mesh>

            {/* Glowing Cyan Beam for Active Route */}
            {isActive && (
              <mesh
                position={[midX, 0.15, midZ]}
                rotation={[-Math.PI / 2, 0, angleY - Math.PI / 2]}
              >
                <planeGeometry args={[length, 1.2]} />
                <meshBasicMaterial
                  color="#06b6d4"
                  transparent
                  opacity={0.7}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Amber Congestion Warning Tube */}
            {isCongested && !isBlocked && (
              <mesh
                position={[midX, 0.2, midZ]}
                rotation={[0, angleY, 0]}
              >
                <cylinderGeometry args={[0.3, 0.3, length, 16]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0.8} />
              </mesh>
            )}

            {/* Blocked Edge Physical Hazard Barricade */}
            {isBlocked && (
              <group position={[midX, 1.0, midZ]} rotation={[0, angleY, 0]}>
                {/* Red/Yellow Hazard Barricade */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[2.8, 1.2, 0.4]} />
                  <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.8} />
                </mesh>
                {/* Warning Light on Barricade */}
                <mesh position={[0, 0.8, 0]}>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshBasicMaterial color="#ef4444" />
                </mesh>
                {/* 3D Blocked Badge */}
                <Html position={[0, 1.8, 0]} center distanceFactor={22}>
                  <div className="bg-red-950 text-red-200 border border-red-700 px-2 py-0.5 rounded font-extrabold text-[10px] shadow-2xl tracking-wider uppercase flex items-center gap-1 font-mono">
                    ⛔ BLOCKED
                  </div>
                </Html>
              </group>
            )}

            {/* Congestion % Badge overlay if > 30% */}
            {isCongested && !isBlocked && (
              <Html position={[midX, 1.2, midZ]} center distanceFactor={22}>
                <div className="bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded font-bold text-[10px] shadow-xl tracking-wider font-mono">
                  ⚠️ {Math.round(edge.congestion * 100)}% CONGESTED
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
