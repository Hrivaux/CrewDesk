"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps, ReactElement } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Html, RoundedBox, Text } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import type { AgentId, AgentStatus, Task, TaskStatus } from "@/services/types";
import { useCrewStore } from "@/stores/useCrewStore";

type VisualStatus = "idle" | "working" | "blocked" | "review" | "done";
type StationId = "planning" | "terminal" | "review" | "qa" | "security" | "deploy";

interface SceneAgent {
  id: string;
  sourceId: AgentId;
  name: string;
  role: string;
  color: string;
  status: VisualStatus;
  task: string;
  progress: number;
  position: [number, number, number];
  targetPosition: [number, number, number];
  station: StationId;
  stationLabel: string;
  lastAction: string;
}

const STATIONS: Record<StationId, { label: string; position: [number, number, number] }> = {
  planning: { label: "Planning", position: [-2.22, 0, -0.42] },
  terminal: { label: "Terminal", position: [-0.2, 0, -0.02] },
  review: { label: "Review", position: [1.32, 0, -0.66] },
  qa: { label: "QA", position: [1.18, 0, 1.26] },
  security: { label: "Security", position: [2.16, 0, 0.72] },
  deploy: { label: "Deploy", position: [-2.28, 0, 1.25] },
};

const ROLE_STATION: Record<string, StationId> = {
  planner: "planning",
  coder: "terminal",
  reviewer: "review",
  qa: "qa",
  deploy: "deploy",
};

const AGENT_STATION_OFFSET: Record<string, [number, number, number]> = {
  planner: [-0.22, 0, -0.12],
  coder: [0.2, 0, 0.1],
  reviewer: [-0.16, 0, 0.17],
  qa: [0.18, 0, -0.18],
  deploy: [0.08, 0, 0.22],
};

const AGENT_LABEL_OFFSET: Record<string, [number, number, number]> = {
  planner: [-0.18, 0.18, -0.08],
  coder: [0.16, 0.02, 0.06],
  reviewer: [-0.2, -0.12, 0.12],
  qa: [0.22, 0.34, -0.04],
  deploy: [-0.04, 0.52, 0.14],
};

const FALLBACK_AGENTS: readonly Omit<SceneAgent, "status" | "task" | "progress" | "lastAction" | "targetPosition" | "station" | "stationLabel">[] = [
  {
    id: "planner",
    sourceId: "atlas",
    name: "Planner",
    role: "Décompose les tâches",
    color: "#8B5CF6",
    position: [-2.25, 0, -0.25],
  },
  {
    id: "coder",
    sourceId: "forge",
    name: "Coder",
    role: "Écrit le code",
    color: "#38BDF8",
    position: [-0.45, 0, 0.12],
  },
  {
    id: "reviewer",
    sourceId: "pixel",
    name: "Reviewer",
    role: "Vérifie les livrables",
    color: "#F97316",
    position: [1.35, 0, -0.78],
  },
  {
    id: "qa",
    sourceId: "sonar",
    name: "QA",
    role: "Teste les sorties",
    color: "#22C55E",
    position: [1.38, 0, 1.2],
  },
  {
    id: "deploy",
    sourceId: "vega",
    name: "Deploy",
    role: "Publie en production",
    color: "#EAB308",
    position: [-0.9, 0, 1.55],
  },
] as const;

const STATUS_LABEL: Record<VisualStatus, string> = {
  idle: "idle",
  working: "working",
  blocked: "blocked",
  review: "review",
  done: "done",
};

const STATUS_COLOR: Record<VisualStatus, string> = {
  idle: "#94A3B8",
  working: "#22D3EE",
  blocked: "#FB7185",
  review: "#F97316",
  done: "#22C55E",
};

const DEFAULT_TASK: Record<string, Pick<SceneAgent, "status" | "task" | "progress" | "lastAction">> = {
  planner: {
    status: "working",
    task: "Analyse du backlog",
    progress: 64,
    lastAction: "Plan de mission généré",
  },
  coder: {
    status: "working",
    task: "Implémentation UI",
    progress: 42,
    lastAction: "Composant en cours d'écriture",
  },
  reviewer: {
    status: "review",
    task: "Review du composant Board",
    progress: 78,
    lastAction: "Checklist de validation ouverte",
  },
  qa: {
    status: "idle",
    task: "En attente de build",
    progress: 12,
    lastAction: "Tests prêts",
  },
  deploy: {
    status: "blocked",
    task: "Validation humaine requise",
    progress: 86,
    lastAction: "Déploiement mis en pause",
  },
};

function taskToVisualStatus(task: Task | undefined, runtime: AgentStatus | undefined): VisualStatus {
  if (task?.error || task?.revisionNote) return "blocked";
  if (task?.status === "review") return "review";
  if (task?.status === "done") return "done";
  if (task && task.status !== "backlog") return "working";
  if (runtime === "working" || runtime === "walking" || runtime === "returning") return "working";
  return "idle";
}

function taskPriority(status: TaskStatus): number {
  return {
    in_progress: 0,
    assigned: 1,
    review: 2,
    backlog: 3,
    done: 4,
  }[status];
}

function useResponsiveZoom() {
  const [zoom, setZoom] = useState(84);

  useEffect(() => {
    const update = () => setZoom(window.innerWidth < 768 ? 48 : 84);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return zoom;
}

function stationForTask(agentId: string, task: Task | undefined, status: VisualStatus): StationId {
  if (status === "blocked") return "security";
  if (task?.status === "review" || status === "review") return "review";
  if (task?.status === "done" || status === "done") return "deploy";

  const text = `${task?.title ?? ""} ${task?.description ?? ""} ${task?.tags?.join(" ") ?? ""}`.toLowerCase();
  if (/(review|validation|pr|checklist|audit)/.test(text)) return "review";
  if (/(test|qa|bug|recette|playwright|vitest|build)/.test(text)) return "qa";
  if (/(deploy|prod|vercel|release|publish|mise en ligne)/.test(text)) return "deploy";
  if (/(security|permission|auth|api key|clef|clé|secret|supabase)/.test(text)) return "security";
  if (/(code|component|ui|api|route|implément|implement|fix|terminal)/.test(text)) return "terminal";
  if (/(plan|backlog|scope|roadmap|analyse|découpe|decoupe)/.test(text)) return "planning";

  return ROLE_STATION[agentId] ?? "terminal";
}

function useSceneAgents() {
  const tasks = useCrewStore((s) => s.tasks);
  const runtimes = useCrewStore((s) => s.agents);
  const activity = useCrewStore((s) => s.activity);

  return useMemo<SceneAgent[]>(
    () =>
      FALLBACK_AGENTS.map((base) => {
        const task = [...tasks]
          .filter((t) => t.agentId === base.sourceId)
          .sort((a, b) => taskPriority(a.status) - taskPriority(b.status) || b.createdAt - a.createdAt)[0];
        const fallback = DEFAULT_TASK[base.id] ?? DEFAULT_TASK.planner!;
        const latest = activity.find((event) => event.agentId === base.sourceId);

        const visualStatus = taskToVisualStatus(task, runtimes[base.sourceId]?.status);
        const station = stationForTask(base.id, task, visualStatus);
        const stationPosition = STATIONS[station].position;
        const offset = AGENT_STATION_OFFSET[base.id] ?? [0, 0, 0];

        return {
          ...base,
          status: visualStatus,
          task: task?.title ?? fallback.task,
          progress: task?.progress ?? fallback.progress,
          targetPosition: [
            stationPosition[0] + offset[0],
            stationPosition[1] + offset[1],
            stationPosition[2] + offset[2],
          ],
          station,
          stationLabel: STATIONS[station].label,
          lastAction: latest?.message ?? fallback.lastAction,
        };
      }),
    [activity, runtimes, tasks],
  );
}

function IsometricCamera({ zoom }: { zoom: number }) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(7.4, 7.1, 7.4);
    camera.lookAt(0, 0.22, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    if ("zoom" in camera) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }, [camera, zoom]);

  return null;
}

function Label({
  position,
  children,
  muted,
  onClick,
}: {
  position: [number, number, number];
  children: React.ReactNode;
  muted?: boolean;
  onClick?: () => void;
}) {
  return (
    <Html position={position} center occlude={false} style={{ pointerEvents: onClick ? "auto" : "none" }}>
      <button
        type="button"
        className={`scene3d-label ${muted ? "scene3d-label--muted" : ""} ${onClick ? "scene3d-label--button" : ""}`}
        onPointerDown={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
      >
        {children}
      </button>
    </Html>
  );
}

function FloorBase() {
  const gridLines = useMemo(() => {
    const lines: ReactElement[] = [];
    for (let i = -3; i <= 3; i++) {
      lines.push(
        <mesh key={`x-${i}`} position={[i, 0.024, 0]} receiveShadow>
          <boxGeometry args={[0.012, 0.01, 4.36]} />
          <meshStandardMaterial color="#dbe5ef" roughness={0.82} />
        </mesh>,
      );
    }
    for (let i = -2; i <= 2; i++) {
      lines.push(
        <mesh key={`z-${i}`} position={[0, 0.025, i]} receiveShadow>
          <boxGeometry args={[6.76, 0.01, 0.012]} />
          <meshStandardMaterial color="#dbe5ef" roughness={0.82} />
        </mesh>,
      );
    }
    return lines;
  }, []);

  return (
    <group>
      <RoundedBox args={[7.2, 0.24, 4.8]} radius={0.18} smoothness={8} position={[0, -0.12, 0]} receiveShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.72} metalness={0.03} />
      </RoundedBox>
      <RoundedBox args={[7.25, 0.2, 4.86]} radius={0.2} smoothness={8} position={[0, -0.28, 0]} receiveShadow>
        <meshStandardMaterial color="#cbd5e1" roughness={0.78} />
      </RoundedBox>
      {gridLines}
      <mesh position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.85, 4.45]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.18} roughness={0.9} />
      </mesh>
    </group>
  );
}

function GlassWalls() {
  return (
    <group>
      <mesh position={[0, 0.9, -2.26]} castShadow>
        <boxGeometry args={[6.9, 1.8, 0.05]} />
        <meshPhysicalMaterial color="#b4e6ff" transparent opacity={0.23} roughness={0.08} transmission={0.36} thickness={0.18} />
      </mesh>
      <mesh position={[-3.42, 0.9, 0]} castShadow>
        <boxGeometry args={[0.05, 1.8, 4.45]} />
        <meshPhysicalMaterial color="#b4e6ff" transparent opacity={0.19} roughness={0.08} transmission={0.34} thickness={0.18} />
      </mesh>
      {[-2.4, -1.2, 0, 1.2, 2.4].map((x) => (
        <mesh key={x} position={[x, 0.9, -2.22]}>
          <boxGeometry args={[0.025, 1.78, 0.08]} />
          <meshStandardMaterial color="#d9f4ff" roughness={0.4} />
        </mesh>
      ))}
      {[-1.25, 0, 1.25].map((z) => (
        <mesh key={z} position={[-3.38, 0.9, z]}>
          <boxGeometry args={[0.08, 1.78, 0.025]} />
          <meshStandardMaterial color="#d9f4ff" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Screen({
  position,
  scale = 1,
  rotation = [0, 0, 0],
  color = "#22D3EE",
}: {
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[0.72, 0.48, 0.05]} radius={0.035} smoothness={5} castShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.42} />
      </RoundedBox>
      <mesh position={[0, 0, 0.031]}>
        <boxGeometry args={[0.6, 0.36, 0.016]} />
        <meshStandardMaterial color="#0f172a" roughness={0.45} emissive="#0f172a" emissiveIntensity={0.08} />
      </mesh>
      {[0.09, 0, -0.09].map((y, index) => (
        <mesh key={y} position={[-0.06, y, 0.043]}>
          <boxGeometry args={[0.32 - index * 0.06, 0.018, 0.012]} />
          <meshStandardMaterial color={index === 1 ? "#f97316" : color} emissive={index === 1 ? "#f97316" : color} emissiveIntensity={0.35} />
        </mesh>
      ))}
      <mesh position={[0, -0.34, 0]}>
        <boxGeometry args={[0.08, 0.24, 0.06]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.58} />
      </mesh>
      <mesh position={[0, -0.48, 0.04]}>
        <boxGeometry args={[0.34, 0.04, 0.16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.58} />
      </mesh>
    </group>
  );
}

function Desk({ position, rotationY = 0, accent = "#22D3EE" }: { position: [number, number, number]; rotationY?: number; accent?: string }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.24, 0.18, 0.72]} radius={0.055} smoothness={6} position={[0, 0.36, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#b9824b" roughness={0.58} />
      </RoundedBox>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[1.08, 0.2, 0.58]} />
        <meshStandardMaterial color="#9a673c" roughness={0.7} />
      </mesh>
      <Screen position={[-0.16, 0.82, -0.22]} scale={0.92} rotation={[0, 0, 0]} color={accent} />
      <Screen position={[0.42, 0.72, -0.15]} scale={0.62} rotation={[0, -0.18, 0]} color={accent} />
      <mesh position={[0.1, 0.49, 0.1]}>
        <boxGeometry args={[0.44, 0.035, 0.18]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.78} />
      </mesh>
      <mesh position={[0.44, 0.5, 0.16]}>
        <sphereGeometry args={[0.07, 18, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.62} />
      </mesh>
    </group>
  );
}

function KanbanWall() {
  return (
    <group position={[-1.25, 1.16, -2.18]}>
      <RoundedBox args={[1.85, 1.05, 0.08]} radius={0.08} smoothness={6} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.52} />
      </RoundedBox>
      {[-0.58, 0, 0.58].map((x, col) => (
        <group key={x} position={[x, 0, 0.06]}>
          <RoundedBox args={[0.46, 0.74, 0.035]} radius={0.04} smoothness={4}>
            <meshStandardMaterial color={col === 0 ? "#e0f2fe" : col === 1 ? "#fef3c7" : "#dcfce7"} roughness={0.6} />
          </RoundedBox>
          {[0.21, 0.03, -0.15].map((y, i) => (
            <mesh key={y} position={[0, y, 0.035 + i * 0.002]}>
              <boxGeometry args={[0.29 - i * 0.03, 0.028, 0.01]} />
              <meshStandardMaterial color={col === 0 ? "#38bdf8" : col === 1 ? "#f97316" : "#22c55e"} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      <Text position={[0, 0.68, 0.07]} fontSize={0.09} color="#334155" anchorX="center" anchorY="middle">
        KANBAN
      </Text>
      <Label position={[0, 0.98, 0.12]} muted>Kanban Wall</Label>
    </group>
  );
}

function TerminalStation() {
  const lines = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!lines.current) return;
    lines.current.position.y = Math.sin(clock.elapsedTime * 2.4) * 0.015;
  });

  return (
    <group position={[-0.3, 0, -0.55]}>
      <Desk position={[0, 0, 0]} accent="#22D3EE" />
      <group ref={lines} position={[0, 1.03, -0.17]}>
        {[0.12, 0.04, -0.04, -0.12].map((y, i) => (
          <mesh key={y} position={[0.02, y, 0.06]}>
            <boxGeometry args={[0.36 - i * 0.05, 0.012, 0.01]} />
            <meshStandardMaterial color={i % 2 ? "#fb923c" : "#22d3ee"} emissive={i % 2 ? "#fb923c" : "#22d3ee"} emissiveIntensity={0.45} />
          </mesh>
        ))}
      </group>
      <Label position={[0, 1.64, -0.3]}>Terminal Station</Label>
    </group>
  );
}

function ReviewBoard() {
  return (
    <group position={[1.45, 1.05, -2.18]}>
      <RoundedBox args={[1.48, 0.88, 0.075]} radius={0.075} smoothness={6} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.54} />
      </RoundedBox>
      {[0.22, 0.05, -0.12].map((y, i) => (
        <group key={y} position={[-0.28, y, 0.055]}>
          <mesh position={[-0.27, 0, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.012]} />
            <meshStandardMaterial color={i === 2 ? "#22c55e" : "#e2e8f0"} roughness={0.5} />
          </mesh>
          <mesh position={[0.12, 0, 0]}>
            <boxGeometry args={[0.58 - i * 0.09, 0.028, 0.012]} />
            <meshStandardMaterial color={i === 1 ? "#f97316" : "#64748b"} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <Text position={[0, 0.55, 0.07]} fontSize={0.08} color="#334155" anchorX="center" anchorY="middle">
        REVIEW
      </Text>
      <Label position={[0, 0.86, 0.1]} muted>Review Board</Label>
    </group>
  );
}

function SecurityGate() {
  return (
    <group position={[2.45, 0, 0.68]}>
      {[-0.34, 0.34].map((x) => (
        <RoundedBox key={x} args={[0.18, 1.0, 0.2]} radius={0.06} smoothness={5} position={[x, 0.5, 0]} castShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.55} />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.5, 0.035, 0.035]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
      </mesh>
      <Label position={[0, 1.34, 0]}>Security Gate</Label>
    </group>
  );
}

function DeployZone() {
  return (
    <group position={[-2.55, 0, 1.32]}>
      <RoundedBox args={[0.86, 0.16, 0.86]} radius={0.12} smoothness={8} position={[0, 0.08, 0]} receiveShadow>
        <meshStandardMaterial color="#e2e8f0" roughness={0.68} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.86, 0.42]} radius={0.06} smoothness={6} position={[0, 0.58, 0]} castShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.58} />
      </RoundedBox>
      {[-0.18, 0, 0.18].map((x, i) => (
        <mesh key={x} position={[x, 0.82, 0.225]}>
          <sphereGeometry args={[0.035, 14, 10]} />
          <meshStandardMaterial color={i === 1 ? "#f97316" : "#22c55e"} emissive={i === 1 ? "#f97316" : "#22c55e"} emissiveIntensity={0.65} />
        </mesh>
      ))}
      <Label position={[0, 1.3, 0]}>Deploy Zone</Label>
    </group>
  );
}

function WorkZones() {
  return (
    <group>
      <KanbanWall />
      <TerminalStation />
      <ReviewBoard />
      <SecurityGate />
      <DeployZone />
      <Desk position={[1.65, 0, 0.38]} rotationY={0.14} accent="#f97316" />
      <Desk position={[-1.95, 0, -0.05]} rotationY={-0.08} accent="#8b5cf6" />
      <Desk position={[0.9, 0, 1.55]} rotationY={-0.2} accent="#22c55e" />
    </group>
  );
}

function AgentBot({
  agent,
  selected,
  onClick,
}: {
  agent: SceneAgent;
  selected: boolean;
  onClick: (agent: SceneAgent) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const phase = useMemo(() => agent.position[0] * 1.7 + agent.position[2] * 2.3, [agent.position]);
  const labelOffset = AGENT_LABEL_OFFSET[agent.id] ?? [0, 0, 0];
  const target = useMemo(
    () => new THREE.Vector3(agent.targetPosition[0], agent.targetPosition[1], agent.targetPosition[2]),
    [agent.targetPosition],
  );
  const base = agent.targetPosition[1];
  const active = agent.status === "working" || agent.status === "review" || agent.status === "blocked";

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const current = ref.current.position;
    const workRadius = active ? 0.14 : 0.035;
    const targetX = target.x + Math.sin(clock.elapsedTime * 0.62 + phase) * workRadius;
    const targetZ = target.z + Math.cos(clock.elapsedTime * 0.54 + phase) * workRadius * 0.62;
    const dx = targetX - current.x;
    const dz = targetZ - current.z;
    const moving = active || Math.hypot(dx, dz) > 0.025;

    current.x = THREE.MathUtils.damp(current.x, targetX, 2.9, delta);
    current.z = THREE.MathUtils.damp(current.z, targetZ, 2.9, delta);
    current.y = base + Math.sin(clock.elapsedTime * 2.8 + phase) * (moving ? 0.06 : 0.035);

    const desiredRotation = moving ? Math.atan2(dx, dz) : -Math.PI / 4;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, desiredRotation, 4, delta);

    if (body.current) {
      body.current.rotation.z = Math.sin(clock.elapsedTime * 7.5 + phase) * (moving ? 0.055 : 0.018);
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick(agent);
  };

  return (
    <group ref={ref} position={agent.position} onClick={handleClick}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <torusGeometry args={[0.38, 0.012, 12, 42]} />
        <meshStandardMaterial
          color={selected ? "#ffffff" : STATUS_COLOR[agent.status]}
          emissive={STATUS_COLOR[agent.status]}
          emissiveIntensity={active ? 0.45 : 0.14}
          transparent
          opacity={selected ? 0.96 : 0.58}
        />
      </mesh>
      <group ref={body}>
        <mesh castShadow position={[0, 0.48, 0]}>
          <capsuleGeometry args={[0.18, 0.36, 8, 18]} />
          <meshStandardMaterial color={agent.color} roughness={0.48} metalness={0.08} />
        </mesh>
        <mesh castShadow position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.24, 28, 20]} />
          <meshStandardMaterial color={agent.color} roughness={0.42} metalness={0.08} />
        </mesh>
        <RoundedBox args={[0.3, 0.09, 0.035]} radius={0.025} smoothness={5} position={[0, 0.91, 0.225]}>
          <meshStandardMaterial color="#0f172a" emissive="#22d3ee" emissiveIntensity={0.52} />
        </RoundedBox>
        {[-0.28, 0.28].map((x) => (
          <mesh key={x} castShadow position={[x, 0.5, 0]}>
            <capsuleGeometry args={[0.055, 0.22, 6, 10]} />
            <meshStandardMaterial color={agent.color} roughness={0.5} />
          </mesh>
        ))}
      </group>
      <mesh position={[0.3, 1.09, 0.08]}>
        <sphereGeometry args={[0.055, 16, 12]} />
        <meshStandardMaterial color={STATUS_COLOR[agent.status]} emissive={STATUS_COLOR[agent.status]} emissiveIntensity={0.72} />
      </mesh>
      <Label position={[labelOffset[0], 1.36 + labelOffset[1], labelOffset[2]]} onClick={() => onClick(agent)}>
        {agent.name} · {agent.stationLabel}
      </Label>
    </group>
  );
}

function OfficeScene({ selectedId, onSelectAgent }: { selectedId: string | null; onSelectAgent: (agent: SceneAgent) => void }) {
  const agents = useSceneAgents();

  return (
    <group position={[0, -0.18, 0]} scale={1.08}>
      <FloorBase />
      <GlassWalls />
      <WorkZones />
      {agents.map((agent) => (
        <AgentBot key={agent.id} agent={agent} selected={selectedId === agent.id} onClick={onSelectAgent} />
      ))}
    </group>
  );
}

function StatusPanel({ agent, onClose }: { agent: SceneAgent | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {agent ? (
        <motion.aside
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="scene3d-panel"
        >
          <button type="button" className="scene3d-panel-close focus-ring" onClick={onClose} aria-label="Fermer">
            ×
          </button>
          <p className="scene3d-panel-kicker">Agent actif</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="scene3d-panel-dot" style={{ background: agent.color, boxShadow: `0 0 18px ${agent.color}` }} />
            <div>
              <h2 className="font-display text-xl font-semibold text-white">{agent.name}</h2>
              <p className="text-sm text-slate-300">{agent.role}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white/7 p-3">
            <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
              <span className="truncate">{agent.task}</span>
              <span className="font-mono text-cyan">{agent.progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${agent.progress}%` }}
                transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                className="h-full rounded-full"
                style={{ background: STATUS_COLOR[agent.status] }}
              />
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-white/6 p-3">
              <dt className="text-slate-500">Statut</dt>
              <dd className="mt-1 font-mono uppercase tracking-[0.14em]" style={{ color: STATUS_COLOR[agent.status] }}>
                {agent.status}
              </dd>
            </div>
            <div className="rounded-xl bg-white/6 p-3">
              <dt className="text-slate-500">Poste cible</dt>
              <dd className="mt-1 line-clamp-2 text-slate-200">{agent.stationLabel}</dd>
            </div>
          </dl>
          <p className="mt-3 line-clamp-2 text-xs text-slate-400">{agent.lastAction}</p>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function SceneStats({ agents }: { agents: SceneAgent[] }) {
  const working = agents.filter((a) => a.status === "working").length;
  const review = agents.filter((a) => a.status === "review").length;
  const blocked = agents.filter((a) => a.status === "blocked").length;

  return (
    <div className="scene3d-stats" aria-label="Statuts agents 3D">
      <span><b>{working}</b> working</span>
      <span><b>{review}</b> review</span>
      <span><b>{blocked}</b> blocked</span>
    </div>
  );
}

type CanvasCamera = ComponentProps<typeof Canvas>["camera"];

export function CrewDeskThreeScene() {
  const zoom = useResponsiveZoom();
  const agents = useSceneAgents();
  const selectedStoreAgent = useCrewStore((s) => s.selectedAgent);
  const selectStoreAgent = useCrewStore((s) => s.selectAgent);
  const [selected, setSelected] = useState<SceneAgent | null>(null);

  useEffect(() => {
    if (!selectedStoreAgent) return;
    const match = agents.find((agent) => agent.sourceId === selectedStoreAgent);
    if (match) setSelected(match);
  }, [agents, selectedStoreAgent]);

  const camera = useMemo<CanvasCamera>(
    () => ({
      position: [7, 7, 7],
      zoom,
      near: 0.1,
      far: 1000,
    }),
    [zoom],
  );

  return (
    <div className="scene3d-shell">
      <Canvas shadows orthographic camera={camera} dpr={[1, 2]} gl={{ antialias: true, alpha: true }} onPointerMissed={() => setSelected(null)}>
        <color attach="background" args={["#eef3f8"]} />
        <Suspense fallback={null}>
          <IsometricCamera zoom={zoom} />
          <ambientLight intensity={0.72} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.42}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-7}
            shadow-camera-right={7}
            shadow-camera-top={7}
            shadow-camera-bottom={-7}
          />
          <hemisphereLight args={["#ffffff", "#cbd5e1", 0.55]} />
          <OfficeScene
            selectedId={selected?.id ?? null}
            onSelectAgent={(agent) => {
              setSelected(agent);
              selectStoreAgent(agent.sourceId);
            }}
          />
          <ContactShadows position={[0, -0.23, 0]} opacity={0.25} scale={12} blur={2.5} far={5} />
        </Suspense>
      </Canvas>
      <SceneStats agents={agents} />
      <StatusPanel
        agent={selected}
        onClose={() => {
          setSelected(null);
          selectStoreAgent(null);
        }}
      />
    </div>
  );
}
