"use client";

import { RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { Suspense } from "react";
import type { WorkspaceObject } from "@/types/workspace";
import { OBJECT_DEFINITIONS, getBaseSize } from "@/systems/collisions";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { ObjectGLB } from "@/components/workspace3d/objects/ObjectGLB";

export function PlaceableObject({
  object,
  selected,
  interactive = true,
  onDragStart,
}: {
  object: WorkspaceObject;
  selected: boolean;
  interactive?: boolean;
  onDragStart: (id: string) => void;
}) {
  const selectObject = useWorkspaceStore((state) => state.selectObject);
  const definition = OBJECT_DEFINITIONS[object.type];
  const size = getBaseSize(object.type);

  const handlePointerDown = interactive
    ? (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        selectObject(object.id);
        onDragStart(object.id);
      }
    : undefined;

  return (
    <group position={[object.position.x, 0, object.position.z]} rotation={[0, object.rotation, 0]} onPointerDown={handlePointerDown}>
      <Suspense fallback={null}>
        <ObjectGLB type={object.type} />
      </Suspense>
      {interactive || selected ? (
        <RoundedBox args={[size.width + 0.16, 0.04, size.depth + 0.16]} radius={0.08} smoothness={6} position={[0, 0.045, 0]}>
          <meshStandardMaterial
            color={definition.color}
            emissive={definition.color}
            emissiveIntensity={selected ? 0.36 : 0.08}
            transparent
            opacity={selected ? 0.28 : 0.08}
          />
        </RoundedBox>
      ) : null}
    </group>
  );
}
