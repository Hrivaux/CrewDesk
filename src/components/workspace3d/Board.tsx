"use client";

import { Grid, RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { BOARD_DEPTH, BOARD_WIDTH, OBJECT_DEFINITIONS, snapPoint } from "@/systems/collisions";

function eventPoint(event: ThreeEvent<PointerEvent | MouseEvent>) {
  return snapPoint({ x: event.point.x, z: event.point.z });
}

export function Board({
  draggingObjectId,
  onDragEnd,
}: {
  draggingObjectId: string | null;
  onDragEnd: () => void;
}) {
  const placementType = useWorkspaceStore((state) => state.placementType);
  const hoverPoint = useWorkspaceStore((state) => state.hoverPoint);
  const setHoverPoint = useWorkspaceStore((state) => state.setHoverPoint);
  const placeObjectAt = useWorkspaceStore((state) => state.placeObjectAt);
  const moveObject = useWorkspaceStore((state) => state.moveObject);
  const clearSelection = useWorkspaceStore((state) => state.clearSelection);
  const canPlacePreview = useWorkspaceStore((state) => state.canPlacePreview);
  const validPreview = hoverPoint ? canPlacePreview(hoverPoint) : false;

  return (
    <group>
      <RoundedBox args={[BOARD_WIDTH + 0.28, 0.22, BOARD_DEPTH + 0.28]} radius={0.22} smoothness={10} position={[0, -0.16, 0]}>
        <meshStandardMaterial color="#cbd5e1" roughness={0.68} />
      </RoundedBox>
      <RoundedBox args={[BOARD_WIDTH, 0.16, BOARD_DEPTH]} radius={0.18} smoothness={10} position={[0, -0.04, 0]} receiveShadow>
        <meshStandardMaterial color="#f8fbff" roughness={0.46} metalness={0.02} />
      </RoundedBox>
      <Grid
        position={[0, 0.055, 0]}
        args={[BOARD_WIDTH, BOARD_DEPTH]}
        cellSize={0.5}
        cellThickness={0.45}
        cellColor="#d8e3ee"
        sectionSize={2}
        sectionThickness={0.65}
        sectionColor="#b7c7d8"
        fadeDistance={18}
        fadeStrength={0.4}
        infiniteGrid={false}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.08, 0]}
        onPointerMove={(event) => {
          event.stopPropagation();
          const point = eventPoint(event);
          if (draggingObjectId) moveObject(draggingObjectId, point);
          else setHoverPoint(point);
        }}
        onPointerUp={(event) => {
          event.stopPropagation();
          onDragEnd();
        }}
        onPointerLeave={() => setHoverPoint(null)}
        onClick={(event) => {
          event.stopPropagation();
          if (draggingObjectId) return;
          const point = eventPoint(event);
          if (placementType) placeObjectAt(point);
          else clearSelection();
        }}
      >
        <planeGeometry args={[BOARD_WIDTH, BOARD_DEPTH]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {placementType && hoverPoint ? (
        <RoundedBox
          args={[OBJECT_DEFINITIONS[placementType].size.width, 0.08, OBJECT_DEFINITIONS[placementType].size.depth]}
          radius={0.08}
          smoothness={6}
          position={[hoverPoint.x, 0.12, hoverPoint.z]}
        >
          <meshStandardMaterial
            color={validPreview ? "#22c55e" : "#fb7185"}
            emissive={validPreview ? "#22c55e" : "#fb7185"}
            emissiveIntensity={0.16}
            transparent
            opacity={0.38}
          />
        </RoundedBox>
      ) : null}
    </group>
  );
}
