// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  mergePersisted,
  persistedSlice,
  useCrewStore,
} from "@/stores/useCrewStore";
import type { CrewState } from "@/stores/useCrewStore";
import type { Task } from "@/services/types";

function task(partial: Partial<Task>): Task {
  return {
    id: partial.id ?? "t1",
    title: partial.title ?? "Tâche",
    description: "",
    agentId: partial.agentId ?? "pixel",
    status: partial.status ?? "backlog",
    progress: partial.progress ?? 0,
    estimateMin: partial.estimateMin ?? 10,
    tags: partial.tags ?? [],
    createdAt: partial.createdAt ?? Date.now(),
    ...partial,
  };
}

describe("mergePersisted", () => {
  it("réinitialise les tâches en cours / assignées au backlog", () => {
    const current = useCrewStore.getState();
    const merged = mergePersisted(
      {
        tasks: [
          task({ id: "a", status: "in_progress", progress: 80 }),
          task({ id: "b", status: "assigned", progress: 0 }),
          task({ id: "c", status: "done", progress: 100 }),
        ],
      },
      current,
    );
    expect(merged.tasks.find((t) => t.id === "a")?.status).toBe("backlog");
    expect(merged.tasks.find((t) => t.id === "a")?.progress).toBe(0);
    expect(merged.tasks.find((t) => t.id === "b")?.status).toBe("backlog");
    expect(merged.tasks.find((t) => t.id === "c")?.status).toBe("done");
  });

  it("applique des valeurs par défaut saines pour un état vide", () => {
    const merged = mergePersisted({}, useCrewStore.getState());
    expect(merged.tasks).toEqual([]);
    expect(merged.projects).toEqual([]);
    expect(merged.budgetUSD).toBeNull();
    expect(merged.scenePhase).toBe("day");
    expect(merged.spend).toEqual({ inputTokens: 0, outputTokens: 0, costUSD: 0 });
  });

  it("préserve le runtime des agents (non persisté)", () => {
    const merged = mergePersisted({ tasks: [] }, useCrewStore.getState());
    expect(Object.keys(merged.agents)).toContain("atlas");
  });
});

describe("persistedSlice", () => {
  it("n'expose que la tranche métier (pas le runtime ni l'UI)", () => {
    const slice = persistedSlice(useCrewStore.getState()) as Record<string, unknown>;
    expect(slice).toHaveProperty("tasks");
    expect(slice).toHaveProperty("budgetUSD");
    expect(slice).toHaveProperty("skills");
    expect(slice).not.toHaveProperty("agents");
    expect(slice).not.toHaveProperty("dispatchesFx");
    expect(slice).not.toHaveProperty("trainingAgent");
  });
});

describe("createTask", () => {
  beforeEach(() => {
    useCrewStore.setState({ tasks: [], projects: [], activity: [] } as Partial<CrewState>);
  });

  it("ajoute une tâche au backlog avec valeurs normalisées", () => {
    useCrewStore.getState().createTask({
      title: "  Maquette  ",
      description: "desc",
      agentId: "pixel",
      estimateMin: 18.7,
      tags: ["a", "b", "c", "d"],
    });
    const tasks = useCrewStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    const t = tasks[0]!;
    expect(t.title).toBe("Maquette");
    expect(t.status).toBe("backlog");
    expect(t.estimateMin).toBe(19);
    expect(t.tags).toHaveLength(3); // borné à 3
    expect(t.source).toBe("sim"); // sans projet à dossier
  });

  it("marque la tâche « live » si rattachée à un projet avec dossier", () => {
    useCrewStore.setState({
      projects: [
        {
          id: "p1",
          name: "Site",
          objective: "",
          color: "#fff",
          deadline: 0,
          createdAt: 0,
          dir: "site",
        },
      ],
    } as Partial<CrewState>);
    useCrewStore.getState().createTask({
      title: "X",
      description: "",
      agentId: "forge",
      estimateMin: 10,
      tags: [],
      projectId: "p1",
    });
    expect(useCrewStore.getState().tasks[0]!.source).toBe("live");
  });
});
