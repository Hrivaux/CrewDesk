import type {
  ObjectDefinition,
  ObjectSize,
  Vec2,
  WorkspaceObject,
  WorkspaceObjectType,
  WorkspaceTask,
} from "@/types/workspace";

export const BOARD_WIDTH = 12;
export const BOARD_DEPTH = 8;
export const HALF_BOARD_WIDTH = BOARD_WIDTH / 2;
export const HALF_BOARD_DEPTH = BOARD_DEPTH / 2;
export const GRID_SIZE = 0.5;
export const AGENT_RADIUS = 0.28;
export const OBJECT_PADDING = 0.18;

export const OBJECT_DEFINITIONS: Record<WorkspaceObjectType, ObjectDefinition> = {
  desk: {
    type: "desk",
    label: "Work Desk",
    purpose: "Coding, execution and focused work.",
    task: "work",
    size: { width: 2.1, depth: 1.25 },
    color: "#38bdf8",
  },
  whiteboard: {
    type: "whiteboard",
    label: "Whiteboard",
    purpose: "Planning, architecture and brainstorming.",
    task: "plan",
    size: { width: 1.9, depth: 0.65 },
    color: "#8b5cf6",
  },
  vault: {
    type: "vault",
    label: "Safe / Vault",
    purpose: "Secrets, credentials and protected workflows.",
    task: "secure",
    size: { width: 1.25, depth: 1.05 },
    color: "#22d3ee",
  },
  kanban: {
    type: "kanban",
    label: "Kanban Board",
    purpose: "Task review and progress tracking.",
    task: "review",
    size: { width: 2.0, depth: 0.75 },
    color: "#f97316",
  },
  server: {
    type: "server",
    label: "Server Rack",
    purpose: "Deployments, runtime logs and monitoring.",
    task: "deploy",
    size: { width: 1.2, depth: 1.0 },
    color: "#22c55e",
  },
  meeting: {
    type: "meeting",
    label: "Meeting Table",
    purpose: "Coordination and collaboration space for the crew.",
    size: { width: 2.3, depth: 1.7 },
    color: "#f59e0b",
  },
  plant: {
    type: "plant",
    label: "Plant",
    purpose: "Decorative greenery to warm up the workspace.",
    decor: true,
    size: { width: 0.7, depth: 0.7 },
    color: "#16a34a",
  },
  lamp: {
    type: "lamp",
    label: "Desk Lamp",
    purpose: "Decorative lighting accent for the board.",
    decor: true,
    size: { width: 0.6, depth: 0.6 },
    color: "#fcd34d",
  },
};

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function snapPoint(point: Vec2): Vec2 {
  return {
    x: clamp(snapToGrid(point.x), -HALF_BOARD_WIDTH + GRID_SIZE, HALF_BOARD_WIDTH - GRID_SIZE),
    z: clamp(snapToGrid(point.z), -HALF_BOARD_DEPTH + GRID_SIZE, HALF_BOARD_DEPTH - GRID_SIZE),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function getBaseSize(type: WorkspaceObjectType): ObjectSize {
  return OBJECT_DEFINITIONS[type].size;
}

export function getObjectSize(object: Pick<WorkspaceObject, "type" | "rotation">): ObjectSize {
  const size = getBaseSize(object.type);
  const quarterTurns = Math.round(object.rotation / (Math.PI / 2));
  if (Math.abs(quarterTurns) % 2 === 1) {
    return { width: size.depth, depth: size.width };
  }
  return size;
}

export function getRect(object: Pick<WorkspaceObject, "type" | "position" | "rotation">, padding = OBJECT_PADDING) {
  const size = getObjectSize(object);
  return {
    minX: object.position.x - size.width / 2 - padding,
    maxX: object.position.x + size.width / 2 + padding,
    minZ: object.position.z - size.depth / 2 - padding,
    maxZ: object.position.z + size.depth / 2 + padding,
  };
}

export function pointInsideRect(point: Vec2, rect: ReturnType<typeof getRect>): boolean {
  return point.x >= rect.minX && point.x <= rect.maxX && point.z >= rect.minZ && point.z <= rect.maxZ;
}

export function isInsideBoard(object: Pick<WorkspaceObject, "type" | "position" | "rotation">): boolean {
  const rect = getRect(object, 0);
  return (
    rect.minX >= -HALF_BOARD_WIDTH &&
    rect.maxX <= HALF_BOARD_WIDTH &&
    rect.minZ >= -HALF_BOARD_DEPTH &&
    rect.maxZ <= HALF_BOARD_DEPTH
  );
}

export function rectsOverlap(a: ReturnType<typeof getRect>, b: ReturnType<typeof getRect>): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

export function canPlaceObject(
  candidate: WorkspaceObject,
  objects: WorkspaceObject[],
): { valid: boolean; reason?: string } {
  if (!isInsideBoard(candidate)) return { valid: false, reason: "Object must stay inside the board." };
  const candidateRect = getRect(candidate);
  const overlap = objects.some((object) => object.id !== candidate.id && rectsOverlap(candidateRect, getRect(object)));
  if (overlap) return { valid: false, reason: "Objects cannot overlap." };
  return { valid: true };
}

export function rotateLocal(point: Vec2, rotation: number): Vec2 {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: point.x * cos - point.z * sin,
    z: point.x * sin + point.z * cos,
  };
}

export function addVec(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, z: a.z + b.z };
}

export function getInteractionPoint(object: WorkspaceObject, task: WorkspaceTask): Vec2 {
  const base = getBaseSize(object.type);
  // The desk's chair model sits ~1.12 in front of centre; line the agent up
  // with it so the seated pose reads correctly. Other objects: stand in front.
  const local =
    object.type === "desk" && task === "work"
      ? { x: 0, z: base.depth / 2 + 0.5 }
      : { x: 0, z: base.depth / 2 + 0.62 };

  return snapPoint(addVec(object.position, rotateLocal(local, object.rotation)));
}

export function supportedObjectTypes(task: WorkspaceTask): WorkspaceObjectType[] {
  switch (task) {
    case "work":
      return ["desk"];
    case "plan":
      return ["whiteboard"];
    case "secure":
      return ["vault"];
    case "review":
      return ["kanban"];
    case "deploy":
      return ["server"];
    default:
      return [];
  }
}
