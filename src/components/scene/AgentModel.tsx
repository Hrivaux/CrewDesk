"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { FloatingLabel } from "@/components/scene/FloatingLabel";
import type { NavPoint, SceneAgent } from "@/lib/crewdesk-scene";
import { routeToTarget, STATUS_COLOR, STATUS_LABEL } from "@/lib/crewdesk-scene";

const AGENT_MODEL_PATHS: Record<SceneAgent["id"], string> = {
  atlas: "/assets/models/agents/atlas.glb",
  pixel: "/assets/models/agents/pixel.glb",
  forge: "/assets/models/agents/forge.glb",
  sonar: "/assets/models/agents/sonar.glb",
  vega: "/assets/models/agents/vega.glb",
};

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
  const modelPath = AGENT_MODEL_PATHS[agent.id];
  const gltf = useGLTF(modelPath);
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Object3D>(null);
  const route = useRef<THREE.Vector3[]>([]);
  const routeIndex = useRef(0);
  const routeKey = useRef("");
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
      const sourceIsArray = Array.isArray(object.material);
      const materials = (sourceIsArray ? object.material : [object.material]) as THREE.Material[];
      const nextMaterials = materials.map((sourceMaterial) => {
        if (!(sourceMaterial instanceof THREE.Material)) return sourceMaterial;
        const material = sourceMaterial.clone();
        if (material instanceof THREE.MeshStandardMaterial) {
          const name = object.name.toLowerCase();
          if (name.includes("status") || name.includes("beacon")) {
            material.color.set(STATUS_COLOR[agent.status]);
            material.emissive.set(STATUS_COLOR[agent.status]);
            material.emissiveIntensity = 0.9;
          } else {
            // Fini « plastique bonbon » : brillant, plus saturé, capte les
            // reflets de l'environnement — proche des figurines de la réf.
            material.roughness = Math.min(material.roughness ?? 0.6, 0.32);
            material.metalness = Math.max(material.metalness ?? 0, 0.04);
            material.envMapIntensity = 0.9;
            const hsl = { h: 0, s: 0, l: 0 };
            material.color.getHSL(hsl);
            material.color.setHSL(hsl.h, Math.min(1, hsl.s * 1.28), hsl.l);
          }
          material.needsUpdate = true;
        }
        return material;
      });

      object.material = sourceIsArray ? nextMaterials : nextMaterials[0]!;
    });
    return cloned;
  }, [agent.status, gltf.scene]);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const active = agent.status === "working" || agent.status === "review" || agent.status === "blocked";
    const key = `${agent.zone}:${agent.targetPosition.join(",")}`;

    if (routeKey.current !== key) {
      const current: NavPoint = [group.current.position.x, 0, group.current.position.z];
      route.current = routeToTarget(current, agent.targetPosition, agent.zone).map((point) => new THREE.Vector3(...point));
      routeIndex.current = route.current.length > 1 ? 1 : 0;
      routeKey.current = key;
    }

    const waypoint = route.current[routeIndex.current] ?? target;
    const dx = waypoint.x - group.current.position.x;
    const dz = waypoint.z - group.current.position.z;
    const distance = Math.hypot(dx, dz);
    const moving = distance > 0.035;

    if (moving) {
      const speed = active ? 1.42 : 1.05;
      const step = Math.min(distance, speed * delta);
      group.current.position.x += (dx / distance) * step;
      group.current.position.z += (dz / distance) * step;
    } else if (routeIndex.current < route.current.length - 1) {
      routeIndex.current += 1;
    } else {
      const orbit = active ? 0.055 : 0.015;
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, target.x + Math.sin(clock.elapsedTime * 0.55 + phase) * orbit, 2.2, delta);
      group.current.position.z = THREE.MathUtils.damp(group.current.position.z, target.z + Math.cos(clock.elapsedTime * 0.48 + phase) * orbit, 2.2, delta);
    }

    group.current.position.y = target.y + Math.sin(clock.elapsedTime * 3.2 + phase) * (moving ? 0.07 : active ? 0.035 : 0.018);
    if (Math.hypot(dx, dz) > 0.002) {
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, Math.atan2(dx, dz), 6.2, delta);
    }

    if (body.current) {
      body.current.rotation.z = Math.sin(clock.elapsedTime * 8.2 + phase) * (moving ? 0.08 : active ? 0.035 : 0.012);
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
      <primitive ref={body} object={model} scale={1.24} />
      {(hovered || selected) ? (
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

Object.values(AGENT_MODEL_PATHS).forEach((path) => useGLTF.preload(path));
