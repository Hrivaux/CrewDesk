"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { FloatingLabel } from "@/components/scene/FloatingLabel";
import type { SceneZone } from "@/lib/crewdesk-scene";

export function WorkZone({
  zone,
  activeAgents,
  selected,
  onHover,
  onSelect,
}: {
  zone: SceneZone;
  activeAgents: number;
  selected: boolean;
  onHover: (zone: SceneZone | null) => void;
  onSelect: (zone: SceneZone) => void;
}) {
  const handleSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(zone);
  };

  return (
    <group>
      <mesh
        position={zone.position}
        onClick={handleSelect}
        onPointerEnter={(event) => {
          event.stopPropagation();
          onHover(zone);
        }}
        onPointerLeave={(event) => {
          event.stopPropagation();
          onHover(null);
        }}
      >
        <boxGeometry args={zone.hitbox} />
        <meshStandardMaterial
          color={zone.color}
          transparent
          opacity={selected ? 0.14 : 0.015}
          emissive={zone.color}
          emissiveIntensity={selected ? 0.16 : 0.02}
          depthWrite={false}
        />
      </mesh>
      {(activeAgents > 0 || selected) ? (
        <FloatingLabel position={[zone.position[0], 1.36, zone.position[2]]} muted>
          {zone.shortName} · {activeAgents}
        </FloatingLabel>
      ) : null}
    </group>
  );
}
