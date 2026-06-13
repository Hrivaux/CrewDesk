"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { EyeShape, WorkspaceAgent } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspaceStore";

function EyePair({ shape }: { shape: EyeShape }) {
  const eyeColor = shape === "alert" ? "#fb7185" : "#67e8f9";
  if (shape === "happy") {
    return (
      <>
        <mesh position={[-0.075, -0.026, 0.025]} rotation={[0, 0, 0.25]}>
          <torusGeometry args={[0.035, 0.006, 8, 16, Math.PI]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0.075, -0.026, 0.025]} rotation={[0, 0, 0.25]}>
          <torusGeometry args={[0.035, 0.006, 8, 16, Math.PI]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={1.4} />
        </mesh>
      </>
    );
  }

  const height = shape === "sleepy" ? 0.015 : shape === "focused" ? 0.028 : 0.048;
  const width = shape === "alert" ? 0.07 : 0.052;
  return (
    <>
      <RoundedBox args={[width, 0.012, height]} radius={0.012} smoothness={4} position={[-0.075, -0.035, 0.025]}>
        <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={1.4} />
      </RoundedBox>
      <RoundedBox args={[width, 0.012, height]} radius={0.012} smoothness={4} position={[0.075, -0.035, 0.025]}>
        <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={1.4} />
      </RoundedBox>
    </>
  );
}

export function Agent3D({ agent, selected }: { agent: WorkspaceAgent; selected: boolean }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const selectAgent = useWorkspaceStore((state) => state.selectAgent);
  const active = agent.animationState !== "idle";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const walking = agent.animationState === "walking";
    const sitting = agent.animationState === "sitting" || agent.animationState === "working";
    const gesture = ["writing", "pointing", "updating", "monitoring", "inspecting"].includes(agent.animationState);

    if (root.current) {
      root.current.position.y = (walking ? Math.abs(Math.sin(t * 8)) * 0.08 : Math.sin(t * 2.2) * 0.025) + (sitting ? -0.22 : 0);
      root.current.rotation.y = agent.rotation;
    }
    if (body.current) {
      body.current.rotation.z = walking ? Math.sin(t * 8) * 0.08 : Math.sin(t * 1.5) * 0.018;
    }
    if (leftArm.current) leftArm.current.rotation.z = walking ? Math.sin(t * 8) * 0.65 : gesture ? Math.sin(t * 4) * 0.45 - 0.45 : -0.22;
    if (rightArm.current) rightArm.current.rotation.z = walking ? -Math.sin(t * 8) * 0.65 : gesture ? Math.cos(t * 4) * 0.45 + 0.45 : 0.22;
  });

  const handleSelect = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    selectAgent(agent.id);
  };

  return (
    <group ref={root} position={[agent.position.x, 0.12, agent.position.z]} onPointerDown={handleSelect}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <torusGeometry args={[selected ? 0.42 : 0.34, 0.012, 12, 48]} />
        <meshStandardMaterial color={selected ? "#ffffff" : agent.color} emissive={agent.color} emissiveIntensity={active ? 0.5 : 0.22} transparent opacity={selected ? 0.9 : 0.46} />
      </mesh>
      <group ref={body}>
        <mesh position={[0, 0.48, 0]} castShadow>
          <capsuleGeometry args={[0.23, 0.42, 12, 28]} />
          <meshStandardMaterial color={agent.color} roughness={0.28} metalness={0.06} />
        </mesh>
        <mesh position={[0, 0.95, 0]} castShadow>
          <sphereGeometry args={[0.27, 36, 18]} />
          <meshStandardMaterial color={agent.color} roughness={0.24} metalness={0.08} />
        </mesh>
        <RoundedBox args={[0.36, 0.055, 0.13]} radius={0.04} smoothness={8} position={[0, -0.235, 0.96]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#08111f" roughness={0.28} />
          <EyePair shape={agent.eyeShape} />
        </RoundedBox>
        <group ref={leftArm} position={[-0.28, 0.58, 0]}>
          <mesh rotation={[0, 0, 0.2]} castShadow>
            <capsuleGeometry args={[0.045, 0.28, 8, 14]} />
            <meshStandardMaterial color={agent.color} roughness={0.3} />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.28, 0.58, 0]}>
          <mesh rotation={[0, 0, -0.2]} castShadow>
            <capsuleGeometry args={[0.045, 0.28, 8, 14]} />
            <meshStandardMaterial color={agent.color} roughness={0.3} />
          </mesh>
        </group>
        <mesh position={[-0.12, 0.09, 0.05]} castShadow>
          <sphereGeometry args={[0.07, 18, 10]} />
          <meshStandardMaterial color="#0f172a" roughness={0.42} />
        </mesh>
        <mesh position={[0.12, 0.09, 0.05]} castShadow>
          <sphereGeometry args={[0.07, 18, 10]} />
          <meshStandardMaterial color="#0f172a" roughness={0.42} />
        </mesh>
      </group>
    </group>
  );
}
