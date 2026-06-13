"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import type { AgentAnimationState, AgentModelId, EyeShape, WorkspaceAgent } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const AGENT_MODEL_PATHS: Record<AgentModelId, string> = {
  atlas: "/assets/models/agents/atlas.glb",
  pixel: "/assets/models/agents/pixel.glb",
  forge: "/assets/models/agents/forge.glb",
  sonar: "/assets/models/agents/sonar.glb",
  vega: "/assets/models/agents/vega.glb",
};

const EYE_ACCENT: Record<EyeShape, string> = {
  normal: "#22d3ee",
  happy: "#4ade80",
  focused: "#38bdf8",
  sleepy: "#818cf8",
  alert: "#fb7185",
};

const GESTURE_STATES: AgentAnimationState[] = ["writing", "pointing", "updating", "monitoring", "inspecting"];

/** Loads the Blender robot, retints its glossy shell to the agent colour and
 *  recolours the visor glow / beacon to match the chosen eye expression. */
function RobotModel({ agent }: { agent: WorkspaceAgent }) {
  const gltf = useGLTF(AGENT_MODEL_PATHS[agent.model]);

  const model = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const accent = new THREE.Color(EYE_ACCENT[agent.eyeShape]);
    const body = new THREE.Color(agent.color);
    cloned.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const list = (Array.isArray(object.material) ? object.material : [object.material]) as THREE.Material[];
      const next = list.map((source) => {
        if (!(source instanceof THREE.MeshStandardMaterial)) return source;
        const material = source.clone();
        const isEmissive = material.emissive.getHexString() !== "000000";
        const luminance = material.color.r * 0.299 + material.color.g * 0.587 + material.color.b * 0.114;
        if (isEmissive) {
          // visor glow, status beacon, halos → expression accent (soft, not neon)
          material.color.copy(accent);
          material.emissive.copy(accent);
          material.emissiveIntensity = 0.85;
        } else if (luminance < 0.12) {
          // visor glass, feet → dark, lightly satined
          material.roughness = 0.45;
          material.metalness = 0.04;
          material.envMapIntensity = 0.45;
        } else {
          // body shell → soft matte plastic in the agent colour
          material.color.copy(body);
          material.roughness = 0.5;
          material.metalness = 0.02;
          material.envMapIntensity = 0.45;
        }
        material.needsUpdate = true;
        return material;
      });
      object.material = Array.isArray(object.material) ? next : next[0]!;
    });
    return cloned;
  }, [gltf.scene, agent.color, agent.eyeShape]);

  return <primitive object={model} />;
}

export function Agent3D({ agent, selected }: { agent: WorkspaceAgent; selected: boolean }) {
  const root = useRef<THREE.Group>(null);
  const rig = useRef<THREE.Group>(null);
  const selectAgent = useWorkspaceStore((state) => state.selectAgent);
  const active = agent.animationState !== "idle";

  const sitY = useRef(0);
  const leanX = useRef(0);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const k = 1 - Math.pow(0.0015, delta);
    const state = agent.animationState;
    const walking = state === "walking";
    const seated = state === "sitting" || state === "working";
    const gesture = GESTURE_STATES.includes(state);

    const targetSit = seated ? -0.22 : 0;
    sitY.current += (targetSit - sitY.current) * k;
    const bob = walking ? Math.abs(Math.sin(t * 9)) * 0.06 : Math.sin(t * 2) * 0.02;

    const targetLean = walking ? 0.12 : seated ? 0.16 : gesture ? -0.06 : 0;
    leanX.current += (targetLean - leanX.current) * k;

    if (root.current) {
      root.current.position.y = sitY.current + bob;
      const cur = root.current.rotation.y;
      let diff = agent.rotation - cur;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      root.current.rotation.y = cur + diff * Math.min(1, k * 1.4);
    }
    if (rig.current) {
      rig.current.rotation.x = leanX.current;
      rig.current.rotation.z = walking ? Math.sin(t * 9) * 0.045 : Math.sin(t * 1.4) * 0.012;
    }
  });

  const handleSelect = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    selectAgent(agent.id);
  };

  return (
    <group ref={root} position={[agent.position.x, 0, agent.position.z]} onPointerDown={handleSelect}>
      {/* selection / status ring on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <torusGeometry args={[selected ? 0.42 : 0.34, 0.014, 14, 56]} />
        <meshStandardMaterial
          color={selected ? "#ffffff" : agent.color}
          emissive={agent.color}
          emissiveIntensity={active ? 0.7 : 0.3}
          transparent
          opacity={selected ? 0.95 : 0.5}
          toneMapped={false}
        />
      </mesh>
      <group ref={rig} scale={0.62}>
        <Suspense fallback={null}>
          <RobotModel agent={agent} />
        </Suspense>
      </group>
    </group>
  );
}

Object.values(AGENT_MODEL_PATHS).forEach((path) => useGLTF.preload(path));
