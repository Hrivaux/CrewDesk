"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { FloatingLabel } from "@/components/scene/FloatingLabel";
import type { SceneAgent } from "@/lib/crewdesk-scene";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/crewdesk-scene";

const MODEL_PATH = "/assets/models/agents/agent-bot.glb";

export function AgentModel({
  agent,
  selected,
  hovered,
  onClick,
  onHover,
}: {
  agent: SceneAgent;
  selected: boolean;
  hovered: boolean;
  onClick: (agent: SceneAgent) => void;
  onHover: (agent: SceneAgent | null) => void;
}) {
  const gltf = useGLTF(MODEL_PATH);
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Object3D>(null);
  const phase = useMemo(() => agent.homePosition[0] * 1.7 + agent.homePosition[2] * 2.3, [agent.homePosition]);
  const target = useMemo(
    () => new THREE.Vector3(agent.targetPosition[0], agent.targetPosition[1], agent.targetPosition[2]),
    [agent.targetPosition],
  );
  const model = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const material = object.material instanceof THREE.Material ? object.material.clone() : undefined;
      if (!material || !(material instanceof THREE.MeshStandardMaterial)) return;
      if (object.name.includes("body") || object.name.includes("head") || object.name.includes("arm")) {
        material.color.set(agent.color);
        material.metalness = 0.14;
        material.roughness = 0.38;
      }
      if (object.name.includes("status") || object.name.includes("beacon")) {
        material.color.set(STATUS_COLOR[agent.status]);
        material.emissive.set(STATUS_COLOR[agent.status]);
        material.emissiveIntensity = 0.78;
      }
      object.material = material;
    });
    return cloned;
  }, [agent.color, agent.status, gltf.scene]);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const active = agent.status === "working" || agent.status === "review" || agent.status === "blocked";
    const orbit = active ? 0.16 : 0.045;
    const tx = target.x + Math.sin(clock.elapsedTime * 0.58 + phase) * orbit;
    const tz = target.z + Math.cos(clock.elapsedTime * 0.52 + phase) * orbit * 0.62;
    const dx = tx - group.current.position.x;
    const dz = tz - group.current.position.z;

    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, tx, 3.2, delta);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, tz, 3.2, delta);
    group.current.position.y = target.y + Math.sin(clock.elapsedTime * 2.4 + phase) * (active ? 0.055 : 0.025);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, Math.atan2(dx, dz), 4.2, delta);

    if (body.current) {
      body.current.rotation.z = Math.sin(clock.elapsedTime * 6.8 + phase) * (active ? 0.05 : 0.015);
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick(agent);
  };

  return (
    <group
      ref={group}
      position={agent.homePosition}
      onClick={handleClick}
      onPointerEnter={(event) => {
        event.stopPropagation();
        onHover(agent);
      }}
      onPointerLeave={(event) => {
        event.stopPropagation();
        onHover(null);
      }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
        <torusGeometry args={[selected ? 0.46 : 0.38, 0.014, 12, 48]} />
        <meshStandardMaterial
          color={selected ? "#ffffff" : STATUS_COLOR[agent.status]}
          emissive={STATUS_COLOR[agent.status]}
          emissiveIntensity={agent.status === "idle" ? 0.18 : 0.56}
          transparent
          opacity={selected ? 0.92 : 0.58}
        />
      </mesh>
      <primitive ref={body} object={model} scale={0.92} />
      {(hovered || selected || agent.status !== "idle") ? (
        <FloatingLabel
          position={[
            agent.labelOffset[0],
            1.34 + agent.labelOffset[1],
            agent.labelOffset[2],
          ]}
          onClick={() => onClick(agent)}
        >
          {agent.name} · {agent.role} · {STATUS_LABEL[agent.status]}
        </FloatingLabel>
      ) : null}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
