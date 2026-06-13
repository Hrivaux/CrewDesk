export type WorkspaceObjectType =
  | "desk"
  | "whiteboard"
  | "vault"
  | "kanban"
  | "server"
  | "meeting"
  | "plant"
  | "lamp";

export type WorkspaceTask = "idle" | "work" | "plan" | "secure" | "review" | "deploy";

export type AgentAnimationState =
  | "idle"
  | "walking"
  | "thinking"
  | "working"
  | "sitting"
  | "writing"
  | "pointing"
  | "inspecting"
  | "updating"
  | "monitoring"
  | "celebrating";

export type EyeShape = "normal" | "happy" | "focused" | "sleepy" | "alert";

export type AgentModelId = "atlas" | "pixel" | "forge" | "sonar" | "vega";

export interface Vec2 {
  x: number;
  z: number;
}

export interface ObjectSize {
  width: number;
  depth: number;
}

export interface WorkspaceObject {
  id: string;
  type: WorkspaceObjectType;
  position: Vec2;
  rotation: number;
}

export interface WorkspaceAgent {
  id: string;
  name: string;
  color: string;
  eyeShape: EyeShape;
  model: AgentModelId;
  role: string;
  position: Vec2;
  rotation: number;
  task: WorkspaceTask;
  animationState: AgentAnimationState;
  targetObjectId: string | null;
  path: Vec2[];
  pathIndex: number;
  message: string;
}

export interface ObjectDefinition {
  type: WorkspaceObjectType;
  label: string;
  purpose: string;
  /** Decorative objects (plant, lamp) and collaboration props have no assignable task. */
  task?: WorkspaceTask;
  decor?: boolean;
  size: ObjectSize;
  color: string;
}

export interface SelectionState {
  kind: "object" | "agent";
  id: string;
}
