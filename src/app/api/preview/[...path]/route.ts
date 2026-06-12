import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { workspaceBase } from "@/services/server/workspace";

/** Sert les fichiers d'un dossier projet pour l'aperçu intégré (iframe). */

const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  txt: "text/plain; charset=utf-8",
  md: "text/plain; charset=utf-8",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  map: "application/json",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path ?? [];
  const [slug, ...rest] = segments;
  if (!slug || !/^[a-z0-9][a-z0-9-]{0,47}$/.test(slug)) {
    return new NextResponse("Projet invalide.", { status: 400 });
  }

  const root = path.resolve(workspaceBase(), slug);
  let target = path.resolve(root, rest.join("/"));
  if (target !== root && !target.startsWith(root + path.sep)) {
    return new NextResponse("Chemin hors du projet.", { status: 403 });
  }

  const stat = await fs.stat(target).catch(() => null);
  if (stat?.isDirectory() || target === root) {
    target = path.join(target, "index.html");
  }

  const data = await fs.readFile(target).catch(() => null);
  if (data === null) {
    return new NextResponse(
      "Fichier introuvable — les agents n'ont peut-être pas encore produit l'index.html.",
      { status: 404 },
    );
  }

  const ext = path.extname(target).slice(1).toLowerCase();
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "content-type": TYPES[ext] ?? "application/octet-stream",
      "cache-control": "no-store",
    },
  });
}
