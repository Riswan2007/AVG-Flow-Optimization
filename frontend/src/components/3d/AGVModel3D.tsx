import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { AGV } from '../../types/smartagv';
import * as THREE from 'three';

interface AGVModel3DProps {
  agv: AGV;
  position: [number, number, number];
  rotationY: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (agvId: string) => void;
  onHover: (agvId: string | null) => void;
}

export const AGVModel3D: React.FC<AGVModel3DProps> = ({
  agv,
  position,
  rotationY,
  isSelected,
  isHovered,
  onSelect,
  onHover
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);

  // Animate beacon pulse for busy/offline/charging
  useFrame((state) => {
    if (beaconRef.current) {
      if (agv.status === 'offline') {
        const scale = 1.0 + Math.sin(state.clock.elapsedTime * 8) * 0.3;
        beaconRef.current.scale.set(scale, scale, scale);
      } else if (agv.status === 'busy') {
        const scale = 1.0 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
        beaconRef.current.scale.set(scale, scale, scale);
      }
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
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(agv.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(agv.id);
      }}
      onPointerOut={() => onHover(null)}
    >
      {/* Selection Glow Cylinder */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[2.2, 2.2, 0.1, 32]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
        </mesh>
      )}

      {/* Main AMR / AGV Chassis */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.8, 3.2]} />
        <meshStandardMaterial color={isSelected ? "#1e293b" : "#0f172a"} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Top Protective Bumper / Edge Strip */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[2.45, 0.1, 3.25]} />
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.3} />
      </mesh>

      {/* 4 Rubber Wheels */}
      {[-1.1, 1.1].map((x, xi) =>
        [-1.0, 1.0].map((z, zi) => (
          <mesh key={`${xi}-${zi}`} position={[x, 0.3, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.3, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
        ))
      )}

      {/* LiDAR Scanner Cylinder */}
      <mesh position={[0, 1.25, 1.1]}>
        <cylinderGeometry args={[0.25, 0.25, 0.3, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} />
      </mesh>

      {/* Status Light Beacon */}
      <mesh ref={beaconRef} position={[0, 1.4, -1.0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color={getBeaconColor()}
          emissive={getBeaconColor()}
          emissiveIntensity={agv.status === 'offline' ? 2.5 : 1.2}
        />
      </mesh>

      {/* Cargo Payload (visible when busy / carrying material) */}
      {agv.status === 'busy' && (
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[1.8, 0.7, 1.8]} />
          <meshStandardMaterial color="#d97706" metalness={0.3} roughness={0.6} />
        </mesh>
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
              {agv.id}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
