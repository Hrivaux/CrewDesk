"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Bloom, EffectComposer, SMAA } from "@react-three/postprocessing";
import * as THREE from "three";
import { AgentPanel } from "@/components/dashboard/AgentPanel";
import type { SceneSelection } from "@/components/dashboard/AgentPanel";
import { AgentModel } from "@/components/scene/AgentModel";
import { PluginStation } from "@/components/scene/PluginStation";
import { SceneCamera } from "@/components/scene/SceneCamera";
import { WorkZone } from "@/components/scene/WorkZone";
import type { SceneAgent, ScenePlugin, SceneZone } from "@/lib/crewdesk-scene";
import {
  SCENE_AGENT_BASES,
  SCENE_PLUGINS,
  SCENE_ZONES,
  STATUS_COLOR,
  taskPriority,
  taskToVisualStatus,
  targetForAgent,
  zoneForTask,
} from "@/lib/crewdesk-scene";
import { useCrewStore } from "@/stores/useCrewStore";

const SCENE_MODEL = "/assets/models/crewdesk-scene.glb";

type CanvasCamera = ComponentProps<typeof Canvas>["camera"];

function useResponsiveZoom() {
  const [zoom, setZoom] = useState(88);

  useEffect(() => {
    const update = () => setZoom(window.innerWidth < 768 ? 72 : 104);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return zoom;
}

function useSceneAgents() {
  const tasks = useCrewStore((s) => s.tasks);
  const runtimes = useCrewStore((s) => s.agents);
  const activity = useCrewStore((s) => s.activity);

  return useMemo<SceneAgent[]>(
    () =>
      SCENE_AGENT_BASES.map((base) => {
        const task = [...tasks]
          .filter((candidate) => candidate.agentId === base.sourceId)
          .sort((a, b) => taskPriority(a.status) - taskPriority(b.status) || b.createdAt - a.createdAt)[0];
        const latest = activity.find((event) => event.agentId === base.sourceId);
        const status = taskToVisualStatus(task, runtimes[base.sourceId]?.status);
        const zone = zoneForTask(base, task, status);

        return {
          ...base,
          status: task ? status : base.fallbackStatus,
          currentTask: task?.title ?? base.fallbackTask,
          progress: task?.progress ?? base.fallbackProgress,
          zone,
          zoneName: SCENE_ZONES[zone].name,
          targetPosition: targetForAgent(base, zone),
          taskId: task?.id,
          lastAction: latest?.message ?? base.fallbackAction,
        };
      }),
    [activity, runtimes, tasks],
  );
}

function SceneModel() {
  const gltf = useGLTF(SCENE_MODEL);
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      if (object.material instanceof THREE.MeshStandardMaterial || object.material instanceof THREE.MeshPhysicalMaterial) {
        object.material = object.material.clone();
      }
    });
    return clone;
  }, [gltf.scene]);

  return <primitive object={model} />;
}

function SceneSignals({ blocked }: { blocked: boolean }) {
  const terminal = useRef<THREE.Group>(null);
  const deploy = useRef<THREE.Mesh>(null);
  const slack = useRef<THREE.Mesh>(null);
  const vault = useRef<THREE.Mesh>(null);
  const security = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (terminal.current) {
      terminal.current.position.y = Math.sin(clock.elapsedTime * 2.8) * 0.025;
    }
    if (deploy.current) {
      deploy.current.scale.x = 0.75 + (Math.sin(clock.elapsedTime * 1.4) + 1) * 0.22;
    }
    if (slack.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.14;
      slack.current.scale.set(s, s, s);
    }
    if (vault.current) {
      vault.current.rotation.y += 0.006;
    }
    if (security.current) {
      security.current.visible = blocked ? Math.sin(clock.elapsedTime * 5) > -0.45 : true;
    }
  });

  return (
    <group>
      <group ref={terminal} position={[-0.34, 1.05, -0.26]}>
        {[0, 1, 2, 3].map((index) => (
          <mesh key={index} position={[0.02, -index * 0.07, 0]}>
            <boxGeometry args={[0.42 - index * 0.05, 0.015, 0.012]} />
            <meshStandardMaterial color={index % 2 ? "#f97316" : "#22d3ee"} emissive={index % 2 ? "#f97316" : "#22d3ee"} emissiveIntensity={0.58} />
          </mesh>
        ))}
      </group>
      <mesh ref={deploy} position={[-2.58, 0.82, 1.63]}>
        <boxGeometry args={[0.92, 0.045, 0.04]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.72} />
      </mesh>
      <mesh ref={slack} position={[3.52, 0.92, -1.2]}>
        <sphereGeometry args={[0.07, 20, 14]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.72} />
      </mesh>
      <mesh ref={vault} position={[-3.55, 0.89, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.014, 12, 64]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.54} transparent opacity={0.78} />
      </mesh>
      <mesh ref={security} position={[2.68, 0.92, 0.9]}>
        <boxGeometry args={[0.72, 0.04, 0.04]} />
        <meshStandardMaterial color={blocked ? "#fb7185" : "#22d3ee"} emissive={blocked ? "#fb7185" : "#22d3ee"} emissiveIntensity={0.92} />
      </mesh>
    </group>
  );
}

function SceneStats({ agents }: { agents: SceneAgent[] }) {
  const working = agents.filter((agent) => agent.status === "working").length;
  const review = agents.filter((agent) => agent.status === "review").length;
  const blocked = agents.filter((agent) => agent.status === "blocked").length;

  return (
    <div className="scene3d-stats" aria-label="Statuts agents 3D">
      <span><b>{working}</b> working</span>
      <span><b>{review}</b> review</span>
      <span><b>{blocked}</b> blocked</span>
    </div>
  );
}

function agentsInZone(agents: SceneAgent[], zone: SceneZone) {
  return agents.filter((agent) => agent.zone === zone.id);
}

function pluginIsActive(plugin: ScenePlugin, agents: SceneAgent[]) {
  return agents.some((agent) => agent.plugins.includes(plugin.id) && agent.status !== "idle");
}

export function CrewDeskScene() {
  const zoom = useResponsiveZoom();
  const agents = useSceneAgents();
  const selectedStoreAgent = useCrewStore((s) => s.selectedAgent);
  const selectStoreAgent = useCrewStore((s) => s.selectAgent);
  const setSelectedTask = useCrewStore((s) => s.setSelectedTask);
  const setBoardOpen = useCrewStore((s) => s.setBoardOverlayOpen);
  const [lockedSelection, setLockedSelection] = useState<SceneSelection>(null);
  const [hoveredAgent, setHoveredAgent] = useState<SceneAgent | null>(null);
  const [hoveredZone, setHoveredZone] = useState<SceneZone | null>(null);
  const [hoveredPlugin, setHoveredPlugin] = useState<ScenePlugin | null>(null);

  useEffect(() => {
    if (!selectedStoreAgent) return;
    const match = agents.find((agent) => agent.sourceId === selectedStoreAgent);
    if (match) setLockedSelection({ type: "agent", agent: match });
  }, [agents, selectedStoreAgent]);

  const selectedAgentId = lockedSelection?.type === "agent" ? lockedSelection.agent.id : null;
  const blocked = agents.some((agent) => agent.status === "blocked");
  const hoverSelection: SceneSelection = hoveredZone
    ? { type: "zone", zone: hoveredZone, activeAgents: agentsInZone(agents, hoveredZone) }
    : hoveredPlugin
      ? { type: "plugin", plugin: hoveredPlugin }
      : null;
  const panelSelection = lockedSelection ?? hoverSelection;

  const camera = useMemo<CanvasCamera>(
    () => ({
      position: [7.2, 7.4, 7.2],
      zoom,
      near: 0.1,
      far: 1000,
    }),
    [zoom],
  );

  return (
    <div className="scene3d-shell scene3d-shell--cockpit">
      <Canvas
        shadows
        orthographic
        camera={camera}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => {
          setLockedSelection(null);
          selectStoreAgent(null);
        }}
      >
        <color attach="background" args={["#f2f6fa"]} />
        <fog attach="fog" args={["#f2f6fa", 30, 60]} />
        <Suspense fallback={null}>
          <SceneCamera zoom={zoom} />

          {/* Éclairage haut-clé, doux et uniforme : ambiance « maquette
              de studio » claire et aérée, ombres légères. */}
          <ambientLight intensity={0.95} />
          <hemisphereLight args={["#ffffff", "#dbe6f2", 0.75]} />
          <directionalLight
            position={[5, 9, 5]}
            intensity={1.05}
            color="#fff6ec"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0004}
            shadow-camera-left={-7}
            shadow-camera-right={7}
            shadow-camera-top={7}
            shadow-camera-bottom={-7}
          />
          <directionalLight position={[-6, 5, -4]} intensity={0.45} color="#eaf3ff" />

          {/* Environnement local (sans HDR externe) pour des reflets doux. */}
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={1.3} position={[0, 6, 0]} scale={[12, 12, 1]} color="#ffffff" />
            <Lightformer intensity={0.8} position={[5, 3, 4]} scale={[7, 7, 1]} color="#eef6ff" />
            <Lightformer intensity={0.6} position={[-5, 3, -4]} scale={[7, 7, 1]} color="#fff2e2" />
          </Environment>

          <group position={[0, -0.2, 0]} scale={1.08}>
            <SceneModel />
            <SceneSignals blocked={blocked} />
            {Object.values(SCENE_ZONES).map((zone) => (
              <WorkZone
                key={zone.id}
                zone={zone}
                activeAgents={agentsInZone(agents, zone).length}
                selected={lockedSelection?.type === "zone" && lockedSelection.zone.id === zone.id}
                onHover={setHoveredZone}
                onSelect={(selectedZone) => setLockedSelection({ type: "zone", zone: selectedZone, activeAgents: agentsInZone(agents, selectedZone) })}
              />
            ))}
            {SCENE_PLUGINS.map((plugin) => (
              <PluginStation key={plugin.id} plugin={plugin} active={pluginIsActive(plugin, agents)} onHover={setHoveredPlugin} />
            ))}
            {agents.map((agent) => (
              <AgentModel
                key={agent.id}
                agent={agent}
                selected={selectedAgentId === agent.id}
                hovered={hoveredAgent?.id === agent.id}
                onHover={setHoveredAgent}
                onClick={(selectedAgent) => {
                  setLockedSelection({ type: "agent", agent: selectedAgent });
                  selectStoreAgent(selectedAgent.sourceId);
                }}
              />
            ))}
          </group>
          <ContactShadows position={[0, -0.23, 0]} opacity={0.28} scale={14} blur={2.6} far={5} resolution={1024} color="#41506b" />

          {/* Post-traitement discret : léger halo sur les accents émissifs
              (écrans, signaux) + anticrénelage. Pas de vignette : la pièce
              reste claire et uniforme, comme la référence studio. */}
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.32} luminanceThreshold={0.9} luminanceSmoothing={0.06} radius={0.5} />
            <SMAA />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <SceneStats agents={agents} />
      <AgentPanel
        selection={panelSelection}
        onClose={() => {
          setLockedSelection(null);
          selectStoreAgent(null);
        }}
        onViewTask={(agent) => {
          if (agent.taskId) setSelectedTask(agent.taskId);
        }}
        onAssign={() => setBoardOpen(true)}
      />
    </div>
  );
}

useGLTF.preload(SCENE_MODEL);
