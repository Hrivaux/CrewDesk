"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useState } from "react";
import { Agent3D } from "@/components/workspace3d/Agent";
import { Board } from "@/components/workspace3d/Board";
import { PlaceableObject } from "@/components/workspace3d/PlaceableObject";
import { useWorkspaceStore } from "@/stores/workspaceStore";

function WorkspaceSimulation() {
  const advanceAgents = useWorkspaceStore((state) => state.advanceAgents);
  useFrame((_, delta) => advanceAgents(delta));
  return null;
}

function AgentPaths() {
  const agents = useWorkspaceStore((state) => state.agents);
  return (
    <>
      {agents.map((agent) =>
        agent.path.length > 1 ? (
          <Line
            key={agent.id}
            points={agent.path.map((point) => [point.x, 0.09, point.z])}
            color={agent.color}
            lineWidth={2}
            transparent
            opacity={0.42}
          />
        ) : null,
      )}
    </>
  );
}

export function WorkspaceCanvas({ mode = "edit" }: { mode?: "edit" | "play" }) {
  const objects = useWorkspaceStore((state) => state.objects);
  const agents = useWorkspaceStore((state) => state.agents);
  const selected = useWorkspaceStore((state) => state.selected);
  const [draggingObjectId, setDraggingObjectId] = useState<string | null>(null);
  const editable = mode === "edit";

  return (
    <Canvas
      shadows
      orthographic
      camera={{ position: [7.8, 7.2, 7.8], zoom: 72, near: 0.1, far: 1000 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onPointerUp={() => setDraggingObjectId(null)}
    >
      {/* transparent background so the board sits on the page (dark on the
          Scène page, light on Configurer) — avoids the washed-out white veil */}
      <Suspense fallback={null}>
        <ambientLight intensity={0.65} />
        <hemisphereLight args={["#ffffff", "#cfe0f5", 0.7]} />
        {/* key light — warm, casts soft shadows */}
        <directionalLight
          position={[4.5, 9, 5.5]}
          intensity={1.15}
          color="#fff6ea"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0004}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        {/* cool fill from the opposite side to keep shadows from going flat */}
        <directionalLight position={[-6, 5, -4]} intensity={0.4} color="#cfe4ff" />
        {/* soft rim from behind for that glossy product highlight */}
        <directionalLight position={[0, 6, -7]} intensity={0.5} color="#ffffff" />
        <Environment preset="studio" environmentIntensity={0.4} />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={0.72}
          maxPolarAngle={1.1}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
          minZoom={46}
          maxZoom={110}
          target={[0, 0.2, 0]}
          screenSpacePanning={false}
        />
        <WorkspaceSimulation />
        <Board draggingObjectId={draggingObjectId} onDragEnd={() => setDraggingObjectId(null)} />
        <AgentPaths />
        {objects.map((object) => (
          <PlaceableObject
            key={object.id}
            object={object}
            selected={selected?.kind === "object" && selected.id === object.id}
            interactive={editable}
            onDragStart={setDraggingObjectId}
          />
        ))}
        {agents.map((agent) => (
          <Agent3D key={agent.id} agent={agent} selected={selected?.kind === "agent" && selected.id === agent.id} />
        ))}
        <ContactShadows position={[0, -0.02, 0]} opacity={0.32} scale={14} blur={2.6} far={8} resolution={1024} color="#475569" />
      </Suspense>
    </Canvas>
  );
}
