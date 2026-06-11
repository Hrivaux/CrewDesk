import type { ReactNode } from "react";

/**
 * Rendu markdown minimaliste et sans dépendance pour les livrables :
 * titres, gras, code inline, blocs de code (avec nom de fichier), listes.
 */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Gras **…** et code `…`
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(re)) {
    const idx = match.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const token = match[0];
    if (token.startsWith("**")) {
      out.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(
        <code
          key={`${keyPrefix}-c${i}`}
          className="rounded bg-[rgba(94,231,255,0.1)] px-1 font-mono text-[0.92em] text-cyan"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    last = idx + token.length;
    i += 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    // Bloc de code clôturé.
    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").trimStart().startsWith("```")) {
        code.push(lines[i] ?? "");
        i += 1;
      }
      i += 1; // saute la clôture
      blocks.push(
        <div key={key++} className="overflow-hidden rounded-lg border border-[rgba(234,240,248,0.1)]">
          {lang ? (
            <div className="border-b border-[rgba(234,240,248,0.08)] bg-[rgba(7,9,14,0.6)] px-3 py-1 font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
              {lang}
            </div>
          ) : null}
          <pre className="thin-scroll overflow-x-auto bg-[rgba(7,9,14,0.5)] p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
            {code.join("\n")}
          </pre>
        </div>,
      );
      continue;
    }

    // Titres.
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1]?.length ?? 1;
      const sizes = ["text-base", "text-sm", "text-[13px]", "text-xs"];
      blocks.push(
        <p
          key={key++}
          className={`font-display font-bold tracking-wide text-foreground ${sizes[level - 1] ?? "text-xs"}`}
        >
          {inline(heading[2] ?? "", `h${key}`)}
        </p>,
      );
      i += 1;
      continue;
    }

    // Listes (- ou * ou 1.).
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*([-*]|\d+\.)\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={key++} className="flex flex-col gap-1 pl-4">
          {items.map((item, j) => (
            <li key={j} className="list-disc text-xs leading-relaxed text-foreground/85 marker:text-muted">
              {inline(item, `li${key}-${j}`)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Paragraphe (regroupe les lignes consécutives non vides).
    if (line.trim() !== "") {
      const para: string[] = [];
      while (
        i < lines.length &&
        (lines[i] ?? "").trim() !== "" &&
        !(lines[i] ?? "").trimStart().startsWith("```") &&
        !/^(#{1,4})\s+/.test(lines[i] ?? "") &&
        !/^\s*([-*]|\d+\.)\s+/.test(lines[i] ?? "")
      ) {
        para.push(lines[i] ?? "");
        i += 1;
      }
      blocks.push(
        <p key={key++} className="text-xs leading-relaxed text-foreground/85">
          {inline(para.join(" "), `p${key}`)}
        </p>,
      );
      continue;
    }

    i += 1;
  }

  return <div className="flex flex-col gap-2.5">{blocks}</div>;
}
