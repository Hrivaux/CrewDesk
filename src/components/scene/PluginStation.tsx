"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FloatingLabel } from "@/components/scene/FloatingLabel";
import type { ScenePlugin } from "@/lib/crewdesk-scene";

export function PluginStation({
  plugin,
  active,
  onHover,
}: {
  plugin: ScenePlugin;
  active: boolean;
  onHover: (plugin: ScenePlugin | null) => void;
}) {
  const pulse = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!pulse.current) return;
    const scale = 1 + Math.sin(clock.elapsedTime * 2.2 + plugin.position[0]) * (active ? 0.1 : 0.035);
    pulse.current.scale.setScalar(scale);
  });

  return (
    <group
      position={plugin.position}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
        onHover(plugin);
      }}
      onPointerLeave={(event) => {
        event.stopPropagation();
        setHovered(false);
        onHover(null);
      }}
    >
      <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.66, 0]}>
        <torusGeometry args={[0.28, 0.01, 10, 40]} />
        <meshStandardMaterial
          color={plugin.color}
          emissive={plugin.color}
          emissiveIntensity={active ? 0.72 : 0.28}
          transparent
          opacity={active ? 0.78 : 0.36}
        />
      </mesh>
      {hovered ? (
        <FloatingLabel position={[0, 0.42, 0]} muted>
          {plugin.label}
        </FloatingLabel>
      ) : null}
    </group>
  );
}
