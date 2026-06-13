"use client";

import { create } from "zustand";
import type {
  AgentModelId,
  EyeShape,
  SelectionState,
  Vec2,
  WorkspaceAgent,
  WorkspaceObject,
  WorkspaceObjectType,
  WorkspaceTask,
} from "@/types/workspace";
import {
  canPlaceObject,
  distance,
  getInteractionPoint,
  snapPoint,
  supportedObjectTypes,
} from "@/systems/collisions";
import { findPath } from "@/systems/pathfinding";
import { TASK_LABELS, animationForTask } from "@/systems/tasks";

interface WorkspaceState {
  objects: WorkspaceObject[];
  agents: WorkspaceAgent[];
  selected: SelectionState | null;
  placementType: WorkspaceObjectType | null;
  hoverPoint: Vec2 | null;
  statusMessage: string;
  addObjectMode: (type: WorkspaceObjectType) => void;
  cancelPlacement: () => void;
  setHoverPoint: (point: Vec2 | null) => void;
  placeObjectAt: (point: Vec2) => void;
  selectObject: (id: string) => void;
  selectAgent: (id: string) => void;
  clearSelection: () => void;
  moveObject: (id: string, point: Vec2) => void;
  rotateObject: (id: string, direction?: 1 | -1) => void;
  deleteObject: (id: string) => void;
  addAgent: () => void;
  updateAgent: (id: string, patch: Partial<Pick<WorkspaceAgent, "name" | "color" | "eyeShape" | "model" | "role">>) => void;
  assignTask: (agentId: string, task: WorkspaceTask) => void;
  advanceAgents: (delta: number) => void;
  canPlacePreview: (point: Vec2, type?: WorkspaceObjectType | null) => boolean;
  resetWorkspace: () => void;
}

const AGENT_COLORS = ["#38bdf8", "#22c55e", "#eab308", "#8b5cf6", "#f97316", "#fb7185"];
const AGENT_NAMES = ["Nova", "Byte", "Kiro", "Luna", "Echo"];
const EYE_SHAPES: EyeShape[] = ["normal", "happy", "focused", "sleepy", "alert"];
const AGENT_MODELS: AgentModelId[] = ["atlas", "sonar", "vega", "pixel", "forge"];

function objectId(type: WorkspaceObjectType): string {
  return `${type}-${crypto.randomUUID().slice(0, 8)}`;
}

function agentId(): string {
  return `agent-${crypto.randomUUID().slice(0, 8)}`;
}

function createAgent(index: number): WorkspaceAgent {
  return {
    id: agentId(),
    name: AGENT_NAMES[index] ?? `Agent ${index + 1}`,
    color: AGENT_COLORS[index % AGENT_COLORS.length]!,
    eyeShape: EYE_SHAPES[index % EYE_SHAPES.length]!,
    model: AGENT_MODELS[index % AGENT_MODELS.length]!,
    role: index === 0 ? "Orchestrator" : "Specialist",
    position: { x: -1.5 + index * 0.65, z: 2.2 },
    rotation: 0,
    task: "idle",
    animationState: "idle",
    targetObjectId: null,
    path: [],
    pathIndex: 0,
    message: "Waiting for assignment.",
  };
}

function taskMessage(task: WorkspaceTask): string {
  return task === "idle" ? "Agent is idle." : `${TASK_LABELS[task]} task assigned.`;
}

/** A ready-to-use office layout (Blender objects) shown by default on the
 *  Scène page — two desks, a whiteboard, kanban, server, vault, a meeting
 *  table and a plant, none overlapping and all inside the board bounds. */
const DEFAULT_LAYOUT: Array<{ type: WorkspaceObjectType; position: Vec2; rotation: number }> = [
  { type: "desk", position: { x: -4.3, z: -2.5 }, rotation: 0 },
  { type: "desk", position: { x: -1.6, z: -2.5 }, rotation: 0 },
  { type: "whiteboard", position: { x: 1.0, z: -2.7 }, rotation: 0 },
  { type: "kanban", position: { x: 3.6, z: -2.6 }, rotation: 0 },
  { type: "server", position: { x: 5.0, z: 0.0 }, rotation: 0 },
  { type: "vault", position: { x: -5.0, z: 0.2 }, rotation: 0 },
  { type: "meeting", position: { x: 1.2, z: 1.6 }, rotation: 0 },
  { type: "plant", position: { x: 4.8, z: 2.6 }, rotation: 0 },
];

function createDefaultObjects(): WorkspaceObject[] {
  return DEFAULT_LAYOUT.map((entry) => ({ id: objectId(entry.type), ...entry }));
}

/** The five specialists, with stable ids matching the orchestrator crew so
 *  the Scène page can drive each robot from Atlas's task assignments. */
const SPECIALISTS: Array<{
  id: string;
  name: string;
  color: string;
  model: AgentModelId;
  eyeShape: EyeShape;
  role: string;
  start: Vec2;
}> = [
  { id: "pixel", name: "Pixel", color: "#FF8A4C", model: "pixel", eyeShape: "focused", role: "Design & Frontend", start: { x: -3, z: 3.2 } },
  { id: "forge", name: "Forge", color: "#4D8DFF", model: "forge", eyeShape: "normal", role: "Développement", start: { x: -1.5, z: 3.2 } },
  { id: "sonar", name: "Sonar", color: "#3CDFA0", model: "sonar", eyeShape: "alert", role: "Recherche & Analyse", start: { x: 0, z: 3.2 } },
  { id: "plume", name: "Plume", color: "#A777FF", model: "atlas", eyeShape: "happy", role: "Contenu & Rédaction", start: { x: 1.5, z: 3.2 } },
  { id: "vega", name: "Vega", color: "#FFC94D", model: "vega", eyeShape: "sleepy", role: "Deploy & Release", start: { x: 3, z: 3.2 } },
];

function createDefaultAgents(): WorkspaceAgent[] {
  return SPECIALISTS.map((spec) => ({
    id: spec.id,
    name: spec.name,
    color: spec.color,
    eyeShape: spec.eyeShape,
    model: spec.model,
    role: spec.role,
    position: spec.start,
    rotation: Math.PI,
    task: "idle",
    animationState: "idle",
    targetObjectId: null,
    path: [],
    pathIndex: 0,
    message: "En attente d'une tâche.",
  }));
}

function resolveTaskPath(
  agent: WorkspaceAgent,
  task: WorkspaceTask,
  objects: WorkspaceObject[],
  agents: WorkspaceAgent[],
): Pick<WorkspaceAgent, "path" | "pathIndex" | "targetObjectId" | "task" | "animationState" | "message"> {
  if (task === "idle") {
    return {
      task,
      animationState: "idle",
      targetObjectId: null,
      path: [],
      pathIndex: 0,
      message: "Waiting for assignment.",
    };
  }

  const supportedTypes = supportedObjectTypes(task);
  const candidates = objects
    .filter((object) => supportedTypes.includes(object.type))
    .map((object) => ({ object, point: getInteractionPoint(object, task) }))
    .sort((a, b) => distance(agent.position, a.point) - distance(agent.position, b.point));

  if (!candidates.length) {
    return {
      task: "idle",
      animationState: "idle",
      targetObjectId: null,
      path: [],
      pathIndex: 0,
      message: `No available ${TASK_LABELS[task]} object found. Add one to assign this task.`,
    };
  }

  for (const candidate of candidates) {
    const path = findPath(agent.position, candidate.point, objects, agents, agent.id);
    if (path && path.length) {
      return {
        task,
        animationState: "walking",
        targetObjectId: candidate.object.id,
        path,
        pathIndex: path.length > 1 ? 1 : 0,
        message: taskMessage(task),
      };
    }
  }

  return {
    task: "idle",
    animationState: "idle",
    targetObjectId: null,
    path: [],
    pathIndex: 0,
    message: `Path blocked. Move objects or add more space before assigning ${TASK_LABELS[task]}.`,
  };
}

function recalculateMovingAgents(objects: WorkspaceObject[], agents: WorkspaceAgent[]): WorkspaceAgent[] {
  return agents.map((agent) => {
    if (agent.task === "idle" || !agent.targetObjectId) return agent;
    const next = resolveTaskPath(agent, agent.task, objects, agents);
    return { ...agent, ...next };
  });
}

function resolveAgentSeparation(agents: WorkspaceAgent[]): WorkspaceAgent[] {
  const result = agents.map((agent) => ({ ...agent, position: { ...agent.position } }));
  for (let i = 0; i < result.length; i += 1) {
    for (let j = i + 1; j < result.length; j += 1) {
      const a = result[i]!;
      const b = result[j]!;
      const dx = b.position.x - a.position.x;
      const dz = b.position.z - a.position.z;
      const d = Math.hypot(dx, dz);
      if (d >= 0.55 || d < 0.001) continue;
      const push = (0.55 - d) / 2;
      const nx = dx / d;
      const nz = dz / d;
      a.position.x -= nx * push;
      a.position.z -= nz * push;
      b.position.x += nx * push;
      b.position.z += nz * push;
    }
  }
  return result;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  objects: createDefaultObjects(),
  agents: createDefaultAgents(),
  selected: null,
  placementType: null,
  hoverPoint: null,
  statusMessage: "Pick an agent, then assign a task — it walks to the matching station and gets to work.",

  addObjectMode: (type) =>
    set({
      placementType: type,
      selected: null,
      statusMessage: `Click a valid spot on the board to place ${type}.`,
    }),

  cancelPlacement: () => set({ placementType: null, hoverPoint: null }),

  setHoverPoint: (point) => set({ hoverPoint: point ? snapPoint(point) : null }),

  placeObjectAt: (point) => {
    const state = get();
    if (!state.placementType) return;
    const candidate: WorkspaceObject = {
      id: objectId(state.placementType),
      type: state.placementType,
      position: snapPoint(point),
      rotation: 0,
    };
    const placement = canPlaceObject(candidate, state.objects);
    if (!placement.valid) {
      set({ statusMessage: placement.reason ?? "Invalid placement." });
      return;
    }
    set({
      objects: [...state.objects, candidate],
      selected: { kind: "object", id: candidate.id },
      placementType: null,
      hoverPoint: null,
      statusMessage: "Object placed. Drag it, rotate it, or assign agents to it.",
    });
  },

  selectObject: (id) => set({ selected: { kind: "object", id }, placementType: null }),

  selectAgent: (id) => set({ selected: { kind: "agent", id }, placementType: null }),

  clearSelection: () => set({ selected: null }),

  moveObject: (id, point) => {
    const state = get();
    const current = state.objects.find((object) => object.id === id);
    if (!current) return;
    const candidate = { ...current, position: snapPoint(point) };
    const objects = state.objects.map((object) => (object.id === id ? candidate : object));
    const placement = canPlaceObject(candidate, state.objects);
    if (!placement.valid) {
      set({ statusMessage: placement.reason ?? "Invalid placement." });
      return;
    }
    set({
      objects,
      agents: recalculateMovingAgents(objects, state.agents),
      statusMessage: "Object moved. Navigation paths recalculated.",
    });
  },

  rotateObject: (id, direction = 1) => {
    const state = get();
    const current = state.objects.find((object) => object.id === id);
    if (!current) return;
    const candidate = { ...current, rotation: current.rotation + direction * (Math.PI / 2) };
    const placement = canPlaceObject(candidate, state.objects);
    if (!placement.valid) {
      set({ statusMessage: placement.reason ?? "Cannot rotate here." });
      return;
    }
    const objects = state.objects.map((object) => (object.id === id ? candidate : object));
    set({
      objects,
      agents: recalculateMovingAgents(objects, state.agents),
      statusMessage: "Object rotated.",
    });
  },

  deleteObject: (id) => {
    const state = get();
    const objects = state.objects.filter((object) => object.id !== id);
    const agents = state.agents.map((agent) =>
      agent.targetObjectId === id
        ? {
            ...agent,
            targetObjectId: null,
            task: "idle" as const,
            animationState: "idle" as const,
            path: [],
            pathIndex: 0,
            message: "Target object was deleted.",
          }
        : agent,
    );
    set({ objects, agents, selected: null, statusMessage: "Object deleted." });
  },

  addAgent: () => {
    const state = get();
    const agent = createAgent(state.agents.length);
    set({
      agents: [...state.agents, agent],
      selected: { kind: "agent", id: agent.id },
      statusMessage: "Agent added. Customize it or assign a task.",
    });
  },

  updateAgent: (id, patch) =>
    set((state) => ({
      agents: state.agents.map((agent) => (agent.id === id ? { ...agent, ...patch } : agent)),
    })),

  assignTask: (agentId, task) => {
    const state = get();
    const agent = state.agents.find((candidate) => candidate.id === agentId);
    if (!agent) return;
    const next = resolveTaskPath(agent, task, state.objects, state.agents);
    set({
      agents: state.agents.map((candidate) => (candidate.id === agentId ? { ...candidate, ...next } : candidate)),
      statusMessage: next.message,
    });
  },

  advanceAgents: (delta) => {
    const state = get();
    const speed = 1.7;
    let changed = false;
    const agents = state.agents.map((agent) => {
      if (agent.animationState !== "walking" || !agent.path.length) return agent;
      const target = agent.path[agent.pathIndex] ?? agent.path[agent.path.length - 1];
      if (!target) return agent;
      const dx = target.x - agent.position.x;
      const dz = target.z - agent.position.z;
      const dist = Math.hypot(dx, dz);
      changed = true;

      if (dist < 0.035) {
        if (agent.pathIndex >= agent.path.length - 1) {
          return {
            ...agent,
            position: target,
            path: [],
            pathIndex: 0,
            animationState: animationForTask(agent.task),
            rotation: Math.atan2(dx, dz),
            message: `${TASK_LABELS[agent.task]} animation running.`,
          };
        }
        return { ...agent, pathIndex: agent.pathIndex + 1 };
      }

      const step = Math.min(dist, speed * delta);
      return {
        ...agent,
        position: {
          x: agent.position.x + (dx / dist) * step,
          z: agent.position.z + (dz / dist) * step,
        },
        rotation: Math.atan2(dx, dz),
      };
    });

    if (changed) set({ agents: resolveAgentSeparation(agents) });
  },

  canPlacePreview: (point, type) => {
    const placementType = type ?? get().placementType;
    if (!placementType) return false;
    const candidate: WorkspaceObject = {
      id: "preview",
      type: placementType,
      position: snapPoint(point),
      rotation: 0,
    };
    return canPlaceObject(candidate, get().objects).valid;
  },

  resetWorkspace: () =>
    set({
      objects: createDefaultObjects(),
      agents: createDefaultAgents(),
      selected: null,
      placementType: null,
      hoverPoint: null,
      statusMessage: "Workspace reset to the default layout.",
    }),
}));
