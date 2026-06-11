import { BOARD_H, BOARD_W, SLAB_T } from "@/lib/iso";

/**
 * La dalle isométrique : face supérieure carrelée (carré projeté en losange 2:1),
 * tranches d'épaisseur, murs vitrés du fond, halo cyan flottant et anneau radar.
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
      </div>
      <div className="wall wall--ne" style={{ zIndex: 3 }} />
      <div className="radar-ring" style={{ zIndex: 4 }} />
    </div>
  );
}
