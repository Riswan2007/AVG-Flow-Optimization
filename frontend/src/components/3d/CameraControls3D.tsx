import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { AGV, FactoryNode } from '../../types/smartagv';
import * as THREE from 'three';

interface CameraControlsProps {
  mode: 'reset' | 'top' | 'iso' | 'follow';
  selectedAgvId: string | null;
  agvs: AGV[];
  nodes: FactoryNode[];
}

export const CameraControls3D: React.FC<CameraControlsProps> = ({
  mode,
  selectedAgvId,
  agvs,
  nodes
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const nodeMap = new Map<string, FactoryNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  useEffect(() => {
    if (!controlsRef.current) return;

    if (mode === 'reset') {
      camera.position.set(0, 45, 55);
      controlsRef.current.target.set(0, 0, 0);
    } else if (mode === 'top') {
      camera.position.set(0, 75, 0.1);
      controlsRef.current.target.set(0, 0, 0);
    } else if (mode === 'iso') {
      camera.position.set(45, 35, 45);
      controlsRef.current.target.set(0, 0, 0);
    }
    controlsRef.current.update();
  }, [mode, camera]);

  // Smooth camera tracking when in 'follow' mode for selected AGV
  useFrame(() => {
    if (mode === 'follow' && selectedAgvId && controlsRef.current) {
      const agv = agvs.find(a => a.id === selectedAgvId);
      if (agv) {
        let agvX = 0, agvZ = 0;
        if (agv.current_route && agv.current_route.length >= 2) {
          const idx = Math.min(agv.route_index, agv.current_route.length - 2);
          const uNode = nodeMap.get(agv.current_route[idx]);
          const vNode = nodeMap.get(agv.current_route[idx + 1]);
          if (uNode && vNode) {
            const prog = Math.max(0, Math.min(1, agv.sub_progress || 0));
            agvX = uNode.pos.x + (vNode.pos.x - uNode.pos.x) * prog;
            agvZ = (uNode.pos.z || 0) + ((vNode.pos.z || 0) - (uNode.pos.z || 0)) * prog;
          }
        } else {
          const loc = nodeMap.get(agv.location);
          if (loc) {
            agvX = loc.pos.x;
            agvZ = loc.pos.z || 0;
          }
        }

        controlsRef.current.target.lerp(new THREE.Vector3(agvX, 0, agvZ), 0.1);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minDistance={15}
      maxDistance={120}
      maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera from going under factory floor
      enableDamping
      dampingFactor={0.05}
    />
  );
};
