import React from 'react';

export const FactoryEnvironment3D: React.FC = () => {
  return (
    <group>
      {/* Primary Industrial Factory Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[110, 70]} />
        <meshStandardMaterial color="#0b1120" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Grid Floor Overlay Markings */}
      <gridHelper args={[110, 55, "#334155", "#1e293b"]} position={[0, 0.01, 0]} />

      {/* Factory Perimeter Safety Yellow Line Borders */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[100, 60]} />
        <meshBasicMaterial color="#eab308" wireframe />
      </mesh>

      {/* Outer Factory Walls (Lightweight Industrial Glass / Slate Backdrop) */}
      {/* Back Wall */}
      <mesh position={[0, 10, -35]}>
        <boxGeometry args={[110, 20, 1]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.85} roughness={0.9} />
      </mesh>
      {/* Left Wall */}
      <mesh position={[-55, 10, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[70, 20, 1]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.85} roughness={0.9} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[55, 10, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[70, 20, 1]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.85} roughness={0.9} />
      </mesh>

      {/* Overhead Lighting Support Trusses */}
      {[-30, 0, 30].map((x, i) => (
        <group key={i} position={[x, 18, 0]}>
          <mesh>
            <boxGeometry args={[1, 0.5, 70]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
