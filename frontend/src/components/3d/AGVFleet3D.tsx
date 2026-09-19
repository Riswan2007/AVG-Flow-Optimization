import React, { useMemo } from 'react';
import type { AGV, FactoryNode } from '../../types/smartagv';
import { AGVModel3D } from './AGVModel3D';

interface AGVFleet3DProps {
  agvs: AGV[];
  nodes: FactoryNode[];
  selectedAgvId: string | null;
  hoveredAgvId: string | null;
  onSelectAgv: (agvId: string) => void;
  onHoverAgv: (agvId: string | null) => void;
}

export const AGVFleet3D: React.FC<AGVFleet3DProps> = ({
  agvs,
  nodes,
  selectedAgvId,
  hoveredAgvId,
  onSelectAgv,
  onHoverAgv
}) => {
  const nodeMap = useMemo(() => {
    const map = new Map<string, FactoryNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  const getAgv3DTransform = (agv: AGV): { position: [number, number, number]; rotationY: number } => {
    if (!agv.current_route || agv.current_route.length < 2) {
      const locNode = nodeMap.get(agv.location);
      if (locNode) {
        return {
          position: [locNode.pos.x, locNode.pos.y || 0, locNode.pos.z || 0],
          rotationY: 0
        };
      }
      return { position: [0, 0, 0], rotationY: 0 };
    }

    const idx = Math.min(agv.route_index, agv.current_route.length - 2);
    const uNode = nodeMap.get(agv.current_route[idx]);
    const vNode = nodeMap.get(agv.current_route[idx + 1]);

    if (!uNode || !vNode) {
      const locNode = nodeMap.get(agv.location);
      const pos: [number, number, number] = locNode ? [locNode.pos.x, locNode.pos.y || 0, locNode.pos.z || 0] : [0, 0, 0];
      return { position: pos, rotationY: 0 };
    }

    const progress = Math.max(0, Math.min(1, agv.sub_progress || 0.0));
    
    const uX = uNode.pos.x, uY = uNode.pos.y || 0, uZ = uNode.pos.z || 0;
    const vX = vNode.pos.x, vY = vNode.pos.y || 0, vZ = vNode.pos.z || 0;

    const x = uX + (vX - uX) * progress;
    const y = uY + (vY - uY) * progress;
    const z = uZ + (vZ - uZ) * progress;

    // Calculate heading angle Y facing direction of movement
    const dx = vX - uX;
    const dz = vZ - uZ;
    const rotationY = Math.atan2(dx, dz);

    return {
      position: [x, y, z],
      rotationY
    };
  };

  return (
    <group>
      {agvs.map((agv) => {
        const transform = getAgv3DTransform(agv);
        return (
          <AGVModel3D
            key={agv.id}
            agv={agv}
            nodeMap={nodeMap}
            position={transform.position}
            rotationY={transform.rotationY}
            isSelected={selectedAgvId === agv.id}
            isHovered={hoveredAgvId === agv.id}
            onSelect={onSelectAgv}
            onHover={onHoverAgv}
          />
        );
      })}
    </group>
  );
};
