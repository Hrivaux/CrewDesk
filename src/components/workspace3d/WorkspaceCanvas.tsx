"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Line, OrbitControls } from "@react-three/drei";
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

export function WorkspaceCanvas() {
  const objects = useWorkspaceStore((state) => state.objects);
  const agents = useWorkspaceStore((state) => state.agents);
  const selected = useWorkspaceStore((state) => state.selected);
  const [draggingObjectId, setDraggingObjectId] = useState<string | null>(null);

  return (
    <Canvas
      shadows
      orthographic
      camera={{ position: [7.8, 7.2, 7.8], zoom: 72, near: 0.1, far: 1000 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      onPointerUp={() => setDraggingObjectId(null)}
    >
      <color attach="background" args={["#edf4fb"]} />
      <fog attach="fog" args={["#edf4fb", 26, 52]} />
      <Suspense fallback={null}>
        <ambientLight intensity={0.78} />
        <hemisphereLight args={["#ffffff", "#dbeafe", 0.6]} />
        <directionalLight
          position={[4.5, 8, 5.5]}
          intensity={1}
          color="#fff7ed"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <Environment preset="city" />
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
            onDragStart={setDraggingObjectId}
          />
        ))}
        {agents.map((agent) => (
          <Agent3D key={agent.id} agent={agent} selected={selected?.kind === "agent" && selected.id === agent.id} />
        ))}
        <ContactShadows position={[0, -0.02, 0]} opacity={0.26} scale={13} blur={2.8} far={7} resolution={1024} color="#64748b" />
      </Suspense>
    </Canvas>
  );
}
