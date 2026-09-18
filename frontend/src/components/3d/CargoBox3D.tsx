import React from 'react';

interface CargoBox3DProps {
  position: [number, number, number];
  color?: string;
  scale?: number;
}

export const CargoBox3D: React.FC<CargoBox3DProps> = ({
  position,
  color = "#d97706",
  scale = 1.0
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Outer Wooden / Metallic Container Box */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.8, 1.4]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Corner Metal Brackets */}
      {[-0.65, 0.65].map((x, xi) =>
        [-0.65, 0.65].map((z, zi) => (
          <mesh key={`${xi}-${zi}`} position={[x, 0.4, z]}>
            <boxGeometry args={[0.15, 0.82, 0.15]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
        ))
      )}
    </group>
  );
};
