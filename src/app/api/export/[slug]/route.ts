import path from "node:path";
import JSZip from "jszip";
import { NextResponse } from "next/server";
import {
  listProjectFiles,
  projectDir,
  readProjectFile,
} from "@/services/server/workspace";

export const maxDuration = 60;

/** Limite de poids du zip (garde-fou mémoire). */
const MAX_TOTAL_BYTES = 80 * 1024 * 1024;

/** Télécharge le projet (dossier de travail des agents) en archive .zip. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let root: string;
  try {
    root = await projectDir(slug);
  } catch {
    return NextResponse.json({ error: "Projet invalide." }, { status: 400 });
  }

  const files = await listProjectFiles(root);
  if (files.length === 0) {
    return NextResponse.json(
      { error: "Projet vide — les agents n'ont pas encore produit de fichiers." },
      { status: 404 },
    );
  }

  const zip = new JSZip();
  const folder = zip.folder(slug) ?? zip;
  let total = 0;
  for (const rel of files) {
    const data = await readProjectFile(root, rel).catch(() => null);
    if (!data) continue;
    total += data.length;
    if (total > MAX_TOTAL_BYTES) {
      return NextResponse.json({ error: "Projet trop volumineux à exporter." }, { status: 413 });
    }
    folder.file(rel, data);
  }

  const archive = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return new NextResponse(archive as unknown as BodyInit, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${path.basename(slug)}.zip"`,
      "cache-control": "no-store",
    },
  });
}
