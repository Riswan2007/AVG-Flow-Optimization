import React from 'react';
import { Html } from '@react-three/drei';

export const FactoryEnvironment3D: React.FC = () => {
  return (
    <group>
      {/* Primary Enclosed Factory Floor Base (84x52) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.5, -0.02, 0]} receiveShadow>
        <planeGeometry args={[84, 52]} />
        <meshStandardMaterial color="#0b1329" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Functional Zone 1: Storage Warehouse Zone (Left) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-28, -0.01, 0]}>
        <planeGeometry args={[22, 46]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      {/* Functional Zone 2: Machine Processing Zone (Center-Right) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[26, -0.01, 0]}>
        <planeGeometry args={[16, 46]} />
        <meshStandardMaterial color="#064e3b" roughness={0.5} />
      </mesh>

      {/* Functional Zone 3: Production Assembly Zone (Far Right) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[38, -0.01, 0]}>
        <planeGeometry args={[8, 28]} />
        <meshStandardMaterial color="#4c1d95" roughness={0.5} />
      </mesh>

      {/* Functional Zone 4: Charging Station Hub (Bottom Center) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1, -0.01, 20]}>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color="#78350f" roughness={0.5} />
      </mesh>

      {/* Subtle Road Grid Helper inside Factory */}
      <gridHelper args={[84, 42, "#0284c7", "#1e293b"]} position={[3.5, 0.005, 0]} />

      {/* Perimeter Safety Yellow/Black Hazard Border Strip */}
      <lineLoop position={[3.5, 0.02, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                -41.5, 0, -25.5,
                 41.5, 0, -25.5,
                 41.5, 0,  25.5,
                -41.5, 0,  25.5
              ]),
              3
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#eab308" linewidth={3} />
      </lineLoop>

      {/* Low-Profile Outer Industrial Facility Walls & Pillars */}
      {/* Back Wall */}
      <mesh position={[3.5, 1.75, -26]}>
        <boxGeometry args={[84, 3.5, 0.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-38.5, 1.75, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[52, 3.5, 0.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[45.5, 1.75, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[52, 3.5, 0.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Front Low Warning Safety Wall */}
      <mesh position={[3.5, 0.4, 26]}>
        <boxGeometry args={[84, 0.8, 0.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* 4 Corner Structural Columns */}
      {[
        [-38.5, -26],
        [45.5, -26],
        [45.5, 26],
        [-38.5, 26]
      ].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, 2.5, cz]}>
          <boxGeometry args={[1.4, 5.0, 1.4]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} />
        </mesh>
      ))}

      {/* Zone Header Labels Attached to Floor Areas */}
      <Html position={[-28, 0.2, -23]} center distanceFactor={28} style={{ pointerEvents: 'none' }}>
        <div className="bg-slate-950/90 text-cyan-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono tracking-wider shadow-md">
          📦 STORAGE WAREHOUSE ZONE
        </div>
      </Html>

      <Html position={[26, 0.2, -23]} center distanceFactor={28} style={{ pointerEvents: 'none' }}>
        <div className="bg-slate-950/90 text-emerald-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono tracking-wider shadow-md">
          ⚙️ MACHINE PROCESSING ZONE
        </div>
      </Html>

      <Html position={[38, 0.2, -13]} center distanceFactor={28} style={{ pointerEvents: 'none' }}>
        <div className="bg-slate-950/90 text-purple-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono tracking-wider shadow-md">
          🏭 PRODUCTION DOCKS
        </div>
      </Html>

      <Html position={[-1, 0.2, 24.5]} center distanceFactor={28} style={{ pointerEvents: 'none' }}>
        <div className="bg-slate-950/90 text-amber-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono tracking-wider shadow-md">
          ⚡ CHARGING HUB BAYS
        </div>
      </Html>
    </group>
  );
};
