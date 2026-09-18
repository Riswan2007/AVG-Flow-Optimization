import React from 'react';

export const FactoryEnvironment3D: React.FC = () => {
  return (
    <group>
      {/* Big Rectangular Factory Floor Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[100, 60]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Grid Lines Inside Factory Rectangle */}
      <gridHelper args={[100, 50, "#0284c7", "#1e293b"]} position={[0, 0.01, 0]} />

      {/* Outer Rectangular Safety Border (Bright Yellow Outline Box) */}
      <lineLoop position={[0, 0.05, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                -50, 0, -30,
                 50, 0, -30,
                 50, 0,  30,
                -50, 0,  30
              ]),
              3
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#eab308" linewidth={3} />
      </lineLoop>

      {/* Subtle Corner Base Markers for the Factory Rectangle */}
      {[
        [-50, -30],
        [50, -30],
        [50, 30],
        [-50, 30]
      ].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, 0.1, cz]}>
          <boxGeometry args={[1.5, 0.2, 1.5]} />
          <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
};
