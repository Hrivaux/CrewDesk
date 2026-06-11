import type { CSSProperties } from "react";
import type { GridPos } from "@/lib/iso";
import { depth, project } from "@/lib/iso";

export type PropKind = "desk" | "server" | "holo" | "kiosk" | "coffee" | "plant";

export interface PropSpec {
  id: string;
  kind: PropKind;
  pos: GridPos;
}

/** Mobilier du bureau : postes de travail, serveur, board holo, borne, café, plantes. */
export const PROPS: readonly PropSpec[] = [
  { id: "holo", kind: "holo", pos: { gx: 5, gy: 0.9 } },
  { id: "desk-a", kind: "desk", pos: { gx: 2.2, gy: 2.0 } },
  { id: "desk-b", kind: "desk", pos: { gx: 7.8, gy: 2.0 } },
  { id: "server", kind: "server", pos: { gx: 8.7, gy: 5.1 } },
  { id: "kiosk", kind: "kiosk", pos: { gx: 1.1, gy: 5.1 } },
  { id: "coffee", kind: "coffee", pos: { gx: 8.3, gy: 8.4 } },
  { id: "plant-1", kind: "plant", pos: { gx: 0.9, gy: 0.9 } },
  { id: "plant-2", kind: "plant", pos: { gx: 9.1, gy: 1.1 } },
  { id: "plant-3", kind: "plant", pos: { gx: 1.0, gy: 8.7 } },
] as const;

const LED_COLORS = ["#3CDFA0", "#5EE7FF", "#3CDFA0", "#FFC94D", "#3CDFA0", "#5EE7FF", "#FF8A4C", "#3CDFA0", "#5EE7FF"];
const LED_DELAYS = [0, 0.7, 1.3, 0.4, 1.9, 0.2, 1.1, 0.9, 1.6];
const BAR_HEIGHTS = ["78%", "52%", "88%", "40%", "64%"];
const BAR_DELAYS = [0, 0.5, 0.2, 0.9, 0.35];
const LEAVES = [
  { rotate: -32, x: -7, y: -32 },
  { rotate: 0, x: -1, y: -36 },
  { rotate: 30, x: 5, y: -32 },
];

function PropBody({ kind }: { kind: PropKind }) {
  switch (kind) {
    case "desk":
      return (
        <>
          <div className="prop-shadow" style={{ width: 86, height: 34, top: -16 }} />
          <div className="floor-refl floor-refl--monitor" />
          <div className="desk-top" />
          <div className="monitor">
            <div className="code-screen" />
          </div>
        </>
      );
    case "server":
      return (
        <>
          <div className="prop-shadow" style={{ width: 44, height: 18, top: -4 }} />
          <div className="floor-refl floor-refl--server" />
          <div className="server">
            {LED_COLORS.map((c, i) => (
              <span
                key={i}
                className="led"
                style={
                  {
                    "--led-c": c,
                    "--led-delay": `${LED_DELAYS[i] ?? 0}s`,
                    "--led-dur": `${1.2 + (i % 4) * 0.4}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </>
      );
    case "holo":
      return (
        <>
          <div className="prop-shadow" style={{ width: 96, height: 22, top: -2 }} />
          <div className="floor-refl floor-refl--holo" />
          <div className="holo">
            {BAR_HEIGHTS.map((h, i) => (
              <span
                key={i}
                className="holo-bar"
                style={{ "--bar-h": h, "--bar-delay": `${BAR_DELAYS[i] ?? 0}s` } as CSSProperties}
              />
            ))}
          </div>
        </>
      );
    case "kiosk":
      return (
        <>
          <div className="prop-shadow" style={{ width: 36, height: 14, top: -3 }} />
          <div className="floor-refl floor-refl--kiosk" />
          <div className="kiosk">
            <div className="kiosk-screen" />
            <div className="kiosk-dot" />
          </div>
        </>
      );
    case "coffee":
      return (
        <>
          <div className="prop-shadow" style={{ width: 38, height: 15, top: -3 }} />
          <div className="floor-refl floor-refl--coffee" />
          <div className="coffee">
            {[0, 0.9, 1.7].map((d, i) => (
              <span key={i} className="steam" style={{ "--delay": `${d}s` } as CSSProperties} />
            ))}
          </div>
        </>
      );
    case "plant":
      return (
        <>
          <div className="prop-shadow" style={{ width: 30, height: 12, top: -3 }} />
          {LEAVES.map((l, i) => (
            <div
              key={i}
              className="plant-leaf"
              style={{ left: l.x, top: l.y, transform: `rotate(${l.rotate}deg)` }}
            />
          ))}
          <div className="plant-pot" />
        </>
      );
  }
}

export function Prop({ spec }: { spec: PropSpec }) {
  const p = project(spec.pos);
  return (
    <div
      className="prop"
      style={{ transform: `translate3d(${p.x}px, ${p.y}px, 0)`, zIndex: 10 + depth(spec.pos) }}
    >
      <PropBody kind={spec.kind} />
    </div>
  );
}
