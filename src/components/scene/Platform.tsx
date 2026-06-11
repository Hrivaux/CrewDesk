import type { CSSProperties } from "react";
import { BOARD_H, BOARD_W, SLAB_T } from "@/lib/iso";

interface WallScreenProps {
  left: string;
  top: number;
  wide?: boolean;
  rows: ReadonlyArray<{ c: string; w: string }>;
}

/** Écran accroché au mur : hérite de l'inclinaison iso du mur porteur. */
function WallScreen({ left, top, wide, rows }: WallScreenProps) {
  return (
    <div className={`wall-screen ${wide ? "wall-screen--wide" : ""}`} style={{ left, top }}>
      {rows.map((r, i) => (
        <span key={i} className="ws-row" style={{ "--c": r.c, "--w": r.w } as CSSProperties} />
      ))}
    </div>
  );
}

/**
 * La dalle isométrique : face supérieure carrelée (carré projeté en losange 2:1),
 * tranches d'épaisseur, murs du fond avec écrans muraux, halo et anneau radar.
 */
export function Platform() {
  return (
    <div
      className="board"
      style={{ width: BOARD_W, height: BOARD_H, ["--slab-t" as string]: `${SLAB_T}px` }}
    >
      <div className="board-halo" style={{ zIndex: 0 }} />
      <div className="board-edge board-edge--w" style={{ zIndex: 1 }} />
      <div className="board-edge board-edge--e" style={{ zIndex: 1 }} />
      <div className="board-top" style={{ zIndex: 2 }} />
      <div className="wall wall--nw" style={{ zIndex: 3 }}>
        <span className="wall-sign">CrewDesk · HQ</span>
        <WallScreen
          left="62%"
          top={26}
          rows={[
            { c: "#FF8A4C", w: "70%" },
            { c: "#4D8DFF", w: "45%" },
            { c: "#3CDFA0", w: "85%" },
          ]}
        />
      </div>
      <div className="wall wall--ne" style={{ zIndex: 3 }}>
        <WallScreen
          left="12%"
          top={16}
          wide
          rows={[
            { c: "#5EE7FF", w: "80%" },
            { c: "#A777FF", w: "55%" },
            { c: "#FFC94D", w: "65%" },
            { c: "#3CDFA0", w: "40%" },
          ]}
        />
        <WallScreen
          left="58%"
          top={30}
          rows={[
            { c: "#4D8DFF", w: "60%" },
            { c: "#FF8A4C", w: "75%" },
            { c: "#5EE7FF", w: "35%" },
          ]}
        />
      </div>
      <div className="radar-ring" style={{ zIndex: 4 }} />
    </div>
  );
}
