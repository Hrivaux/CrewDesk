import { promises as fs } from "node:fs";
import path from "node:path";
import { workspaceBase } from "@/services/server/workspace";

/**
 * Persistance de l'état applicatif (projets, tâches, skills, budget…).
 *
 * Interface volontairement minimale : la v1 écrit un fichier JSON dans le
 * workspace ; le jour J, un `DbStateStore` (Postgres/Supabase) prendra sa
 * place derrière la même interface, scopé par utilisateur, sans toucher au
 * reste de l'application.
 */
export interface PersistedState {
  /** Horodatage de la dernière sauvegarde, pour arbitrer client/serveur. */
  savedAt: number;
  /** Tranche métier sérialisée du store Zustand. */
  data: unknown;
}

export interface StateStore {
  load(scope: string): Promise<PersistedState | null>;
  save(scope: string, state: PersistedState): Promise<void>;
}

/** Implémentation fichier : <workspace>/.crewdesk/state-<scope>.json */
class FileStateStore implements StateStore {
  private dir(): string {
    return path.join(workspaceBase(), ".crewdesk");
  }

  private file(scope: string): string {
    const safe = /^[a-z0-9_-]{1,40}$/.test(scope) ? scope : "default";
    return path.join(this.dir(), `state-${safe}.json`);
  }

  async load(scope: string): Promise<PersistedState | null> {
    try {
      const raw = await fs.readFile(this.file(scope), "utf8");
      const parsed = JSON.parse(raw) as PersistedState;
      if (typeof parsed?.savedAt !== "number") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async save(scope: string, state: PersistedState): Promise<void> {
    await fs.mkdir(this.dir(), { recursive: true });
    // Écriture atomique : fichier temporaire puis renommage.
    const target = this.file(scope);
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(state), "utf8");
    await fs.rename(tmp, target);
  }
}

let store: StateStore | null = null;

/** Le store actif (singleton). Remplacer ici par DbStateStore le jour J. */
export function stateStore(): StateStore {
  store ??= new FileStateStore();
  return store;
}
