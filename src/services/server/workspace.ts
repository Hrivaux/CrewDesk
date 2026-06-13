import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

/**
 * Workspace des projets : chaque projet vit dans un sous-dossier du dossier
 * de base, et les outils des agents sont strictement confinés dedans.
 * Module serveur uniquement (importé par les routes API).
 */

const execFileAsync = promisify(execFile);

export function workspaceBase(): string {
  return process.env.CREWDESK_WORKSPACE ?? path.join(os.homedir(), "CrewDesk-Projets");
}

export function commandsAllowed(): boolean {
  return process.env.CREWDESK_ALLOW_COMMANDS === "1";
}

/** Outils web serveur (recherche/lecture) — activés par défaut, CREWDESK_WEB_TOOLS=0 pour couper. */
export function webToolsEnabled(): boolean {
  return process.env.CREWDESK_WEB_TOOLS !== "0";
}

export const WEB_TOOLS = [
  { type: "web_search_20260209" as const, name: "web_search" as const },
  { type: "web_fetch_20260209" as const, name: "web_fetch" as const },
];

/** Résout le dossier d'un projet (slug contrôlé) et le crée au besoin. */
export async function projectDir(slug: string): Promise<string> {
  if (!/^[a-z0-9][a-z0-9-]{0,47}$/.test(slug)) {
    throw new Error(`Nom de dossier projet invalide : ${slug}`);
  }
  const dir = path.join(workspaceBase(), slug);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Historise le dossier projet : un commit git par tâche terminée.
 * Tolérant : renvoie null (sans bruit) si git est absent ou si rien n'a changé.
 */
export async function commitProject(
  root: string,
  message: string,
): Promise<string | null> {
  const git = (args: string[]) =>
    execFileAsync("git", args, { cwd: root, timeout: 30_000, maxBuffer: 1024 * 1024 });
  try {
    try {
      await fs.access(path.join(root, ".git"));
    } catch {
      await git(["init", "-q"]);
    }
    await git(["add", "-A"]);
    const { stdout: status } = await git(["status", "--porcelain"]);
    if (!status.trim()) return null;
    await git([
      "-c",
      "user.name=CrewDesk",
      "-c",
      "user.email=agents@crewdesk.local",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-q",
      "-m",
      message.slice(0, 200),
    ]);
    const { stdout } = await git(["rev-parse", "--short", "HEAD"]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/** Résout un chemin relatif à l'intérieur du projet — refuse toute évasion. */
function resolveInside(root: string, relPath: string): string {
  const target = path.resolve(root, relPath);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error(`Chemin hors du projet : ${relPath}`);
  }
  return target;
}

const IGNORED = new Set(["node_modules", ".git", ".next", "dist", "build", ".cache"]);

async function listRecursive(root: string, dir: string, out: string[]): Promise<void> {
  if (out.length >= 300) return;
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (out.length >= 300) return;
    if (IGNORED.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (entry.isDirectory()) {
      await listRecursive(root, full, out);
    } else {
      out.push(rel);
    }
  }
}

/** Liste tous les fichiers du projet (chemins relatifs, hors dossiers ignorés). */
export async function listProjectFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  await listRecursive(root, root, out);
  return out.sort();
}

/** Lit un fichier du projet en binaire (chemin relatif confiné). */
export async function readProjectFile(root: string, relPath: string): Promise<Buffer> {
  return fs.readFile(resolveInside(root, relPath));
}

export interface ToolOutcome {
  result: string;
  isError?: boolean;
  /** Fichier écrit (chemin relatif), pour le suivi côté UI. */
  wroteFile?: string;
}

/** Exécute un outil d'agent dans le dossier projet. */
export async function runTool(
  root: string,
  name: string,
  input: Record<string, unknown>,
): Promise<ToolOutcome> {
  try {
    switch (name) {
      case "write_file": {
        const rel = String(input.path ?? "");
        const content = String(input.content ?? "");
        const target = resolveInside(root, rel);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, content, "utf8");
        return { result: `Fichier écrit : ${rel} (${content.length} caractères)`, wroteFile: rel };
      }
      case "read_file": {
        const rel = String(input.path ?? "");
        const target = resolveInside(root, rel);
        const content = await fs.readFile(target, "utf8");
        return {
          result:
            content.length > 50_000
              ? `${content.slice(0, 50_000)}\n… [tronqué, ${content.length} caractères au total]`
              : content,
        };
      }
      case "list_files": {
        const out: string[] = [];
        await listRecursive(root, root, out);
        return { result: out.length === 0 ? "(dossier vide)" : out.sort().join("\n") };
      }
      case "run_command": {
        const command = String(input.command ?? "");
        if (!commandsAllowed()) {
          return {
            result:
              "Exécution de commandes désactivée (CREWDESK_ALLOW_COMMANDS=1 pour l'activer). " +
              "Documente la commande dans le README à la place.",
            isError: true,
          };
        }
        const { stdout, stderr } = await execFileAsync("bash", ["-c", command], {
          cwd: root,
          timeout: 180_000,
          maxBuffer: 1024 * 1024,
        });
        const output = [stdout, stderr].filter(Boolean).join("\n--- stderr ---\n").trim();
        return { result: output.slice(0, 20_000) || "(aucune sortie)" };
      }
      default:
        return { result: `Outil inconnu : ${name}`, isError: true };
    }
  } catch (error) {
    return {
      result: error instanceof Error ? error.message : "Erreur outil inconnue",
      isError: true,
    };
  }
}

export const EXECUTOR_TOOLS = [
  {
    name: "write_file",
    description:
      "Écrit un fichier dans le dossier du projet (crée les dossiers parents). Écrase le fichier s'il existe : fournis toujours le contenu complet.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Chemin relatif au projet, ex. src/index.html" },
        content: { type: "string", description: "Contenu complet du fichier." },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "read_file",
    description: "Lit un fichier du projet (chemin relatif).",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Chemin relatif au projet." },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description:
      "Liste tous les fichiers du projet (récursif, hors node_modules/.git). À appeler en premier pour découvrir l'existant.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "run_command",
    description:
      "Exécute une commande shell dans le dossier du projet (ex. npm install). Peut être désactivée par configuration : dans ce cas, documente la commande dans le README.",
    input_schema: {
      type: "object" as const,
      properties: {
        command: { type: "string", description: "Commande shell à exécuter." },
      },
      required: ["command"],
    },
  },
];
