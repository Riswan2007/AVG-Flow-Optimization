import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { AGV, FactoryNode } from '../../types/smartagv';
import { CargoBox3D } from './CargoBox3D';
import * as THREE from 'three';

interface AGVModel3DProps {
  agv: AGV;
  nodeMap: Map<string, FactoryNode>;
  position: [number, number, number];
  rotationY: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (agvId: string) => void;
  onHover: (agvId: string | null) => void;
}

export const AGVModel3D: React.FC<AGVModel3DProps> = ({
  agv,
  nodeMap,
  position,
  rotationY,
  isSelected,
  isHovered,
  onSelect,
  onHover
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const wheelRefs = useRef<THREE.Mesh[]>([]);

  // Continuous local progress tracking refs for 60FPS fluid motion
  const localSubProgress = useRef(agv.sub_progress || 0);
  const currentRouteIdx = useRef(agv.route_index || 0);
  const initialized = useRef(false);

  // Sync backend telemetry updates softly without interrupting local progress
  if (agv.route_index !== currentRouteIdx.current) {
    currentRouteIdx.current = agv.route_index;
    localSubProgress.current = agv.sub_progress || 0;
  } else if (Math.abs((agv.sub_progress || 0) - localSubProgress.current) > 0.35) {
    localSubProgress.current = agv.sub_progress || 0;
  }

  // Smooth frame-by-frame 60 FPS continuous driving animation
  useFrame((state, delta) => {
    if (groupRef.current) {
      if (!initialized.current) {
        groupRef.current.position.set(position[0], position[1], position[2]);
        groupRef.current.rotation.y = rotationY;
        initialized.current = true;
      } else if (agv.status === 'busy' && agv.current_route && agv.current_route.length >= 2) {
        const idx = Math.min(currentRouteIdx.current, agv.current_route.length - 2);
        const uNode = nodeMap.get(agv.current_route[idx]);
        const vNode = nodeMap.get(agv.current_route[idx + 1]);

        if (uNode && vNode) {
          const uX = uNode.pos.x, uY = uNode.pos.y || 0, uZ = uNode.pos.z || 0;
          const vX = vNode.pos.x, vY = vNode.pos.y || 0, vZ = vNode.pos.z || 0;
          const dx = vX - uX, dz = vZ - uZ;
          const dist = Math.sqrt(dx * dx + dz * dz) || 10.0;

          // Continuous distance progress delta per 60FPS frame
          const speedMetersPerSec = (agv.speed || 3.0) * 2.5;
          localSubProgress.current += (delta * speedMetersPerSec) / dist;

          // Blend gently with backend progress target
          const targetBackendProg = agv.sub_progress || 0;
          localSubProgress.current += (targetBackendProg - localSubProgress.current) * Math.min(1, delta * 2.0);
          localSubProgress.current = Math.max(0.0, Math.min(1.0, localSubProgress.current));

          const p = localSubProgress.current;
          const curX = uX + dx * p;
          const curY = uY + (vY - uY) * p;
          const curZ = uZ + dz * p;
          const headingRotY = Math.atan2(dx, dz);

          // Smoothly update 3D position and heading angle continuously
          groupRef.current.position.lerp(new THREE.Vector3(curX, curY, curZ), Math.min(1, delta * 18));

          let diff = headingRotY - groupRef.current.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          groupRef.current.rotation.y += diff * Math.min(1, delta * 18);
        }
      } else {
        // Smooth idle / charging position LERP
        groupRef.current.position.lerp(new THREE.Vector3(...position), Math.min(1, delta * 12));
        let diff = rotationY - groupRef.current.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        groupRef.current.rotation.y += diff * Math.min(1, delta * 12);
      }
    }

    if (beaconRef.current) {
      if (agv.status === 'offline') {
        const scale = 1.0 + Math.sin(state.clock.elapsedTime * 8) * 0.3;
        beaconRef.current.scale.set(scale, scale, scale);
      } else if (agv.status === 'busy') {
        const scale = 1.0 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
        beaconRef.current.scale.set(scale, scale, scale);
      }
    }

    // Rotate wheels when AGV is moving
    if (agv.status === 'busy' && agv.current_route && agv.current_route.length >= 2) {
      wheelRefs.current.forEach(w => {
        if (w) w.rotation.x += delta * 6;
      });
    }
  });

  const getBeaconColor = () => {
    switch (agv.status) {
      case 'available': return '#10b981'; // Green
      case 'busy': return '#06b6d4';     // Cyan
      case 'charging': return '#f59e0b'; // Amber
      case 'offline': return '#ef4444';  // Red
      default: return '#64748b';
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return '#10b981';
    if (battery > 20) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(agv.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(agv.id);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        onHover(null);
      }}
    >
      {/* Animated Glowing Selection Ring */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]}>
          <ringGeometry args={[1.8, 2.3, 32]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
      )}

      {/* Main AMR / AGV Chassis (Width=2.5, Height=0.8, Length=3.6) */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.8, 3.6]} />
        <meshStandardMaterial color={isSelected ? "#1e293b" : "#0f172a"} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Top Protective Bumper / Edge Strip */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[2.55, 0.1, 3.65]} />
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.3} />
      </mesh>

      {/* 4 Rubber Wheels Sitting ON Road Surface (Y=0.45) */}
      {[-1.2, 1.2].map((x, xi) =>
        [-1.1, 1.1].map((z, zi) => (
          <mesh
            key={`${xi}-${zi}`}
            ref={(el) => {
              if (el) wheelRefs.current[xi * 2 + zi] = el;
            }}
            position={[x, 0.45, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.45, 0.45, 0.35, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
        ))
      )}

      {/* LiDAR Scanner Cylinder */}
      <mesh position={[0, 1.4, 1.3]}>
        <cylinderGeometry args={[0.3, 0.3, 0.35, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} />
      </mesh>

      {/* Status Light Beacon */}
      <mesh ref={beaconRef} position={[0, 1.55, -1.2]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={getBeaconColor()}
          emissive={getBeaconColor()}
          emissiveIntensity={agv.status === 'offline' ? 2.5 : 1.2}
        />
      </mesh>

      {/* Cargo Payload (visible when carrying material) */}
      {agv.status === 'busy' && (
        <CargoBox3D position={[0, 1.3, 0]} color="#d97706" scale={1.1} />
      )}

      {/* Minimal 3D Badge / Full Telemetry on Hover/Select */}
      <Html
        position={[0, 2.6, 0]}
        center
        distanceFactor={22}
        style={{ pointerEvents: 'none' }}
      >
        <div className={`transition-all duration-200 select-none ${
          isSelected || isHovered ? 'scale-110 z-50' : 'scale-90 opacity-90'
        }`}>
          {isSelected || isHovered ? (
            /* Detailed Hover/Select Card */
            <div className="bg-slate-900/95 text-white border border-slate-700 rounded-xl p-2.5 shadow-2xl backdrop-blur-md min-w-[130px] font-sans">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1.5">
                <span className="font-extrabold text-xs text-cyan-400">{agv.id}</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                  agv.status === 'available' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  agv.status === 'busy' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                  agv.status === 'charging' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                  'bg-red-950 text-red-400 border border-red-800'
                }`}>
                  {agv.status}
                </span>
              </div>
              <div className="text-[10px] space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Battery:</span>
                  <span className="font-mono font-bold" style={{ color: getBatteryColor(agv.battery) }}>
                    {Math.round(agv.battery)}%
                  </span>
                </div>
                {agv.current_task && (
                  <div className="text-cyan-300 font-medium truncate">
                    Task: {agv.current_task}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Minimal Floating ID Badge */
            <div className="bg-slate-950/80 border border-slate-800 text-slate-200 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getBeaconColor() }}></span>
              {agv.id} ({Math.round(agv.battery)}%)
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
