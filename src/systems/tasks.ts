import type { AgentAnimationState, WorkspaceTask } from "@/types/workspace";

export const TASK_LABELS: Record<WorkspaceTask, string> = {
  idle: "Idle",
  work: "Work",
  plan: "Plan",
  secure: "Secure",
  review: "Review",
  deploy: "Deploy",
};

export const TASK_DESCRIPTIONS: Record<WorkspaceTask, string> = {
  idle: "Agent waits and idles on the board.",
  work: "Moves to a work desk, sits, and works at the screen.",
  plan: "Moves to a whiteboard and writes or points.",
  secure: "Moves to the vault and runs a security check.",
  review: "Moves to the kanban board and updates cards.",
  deploy: "Moves to a server rack and monitors deployment.",
};

export function animationForTask(task: WorkspaceTask): AgentAnimationState {
  switch (task) {
    case "work":
      return "sitting";
    case "plan":
      return "writing";
    case "secure":
      return "inspecting";
    case "review":
      return "updating";
    case "deploy":
      return "monitoring";
    default:
      return "idle";
  }
}
