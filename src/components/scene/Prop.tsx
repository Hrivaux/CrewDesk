import type { CSSProperties } from "react";
import type { GridPos } from "@/lib/iso";
import { depth, project } from "@/lib/iso";

export type PropKind =
  | "desk"
  | "officeDesk"
  | "chair"
  | "server"
  | "vault"
  | "holo"
  | "kiosk"
  | "whiteboard"
  | "glass"
  | "gate"
  | "cabinet"
  | "cafe"
  | "fridge"
  | "stool"
  | "sofa"
  | "shelf"
  | "rug"
  | "plant"
  | "decal";

export interface PropSpec {
  id: string;
  kind: PropKind;
  pos: GridPos;
  /** Texte (marquage au sol) ou accent (tapis). */
  label?: string;
  color?: string;
  size?: number;
}

/**
 * Le bureau : war room au fond (board holo d'Atlas), open-space avec
 * postes équipés, baie serveur, borne messagerie, cafétéria et lounge.
 */
export const PROPS: readonly PropSpec[] = [
  // Couche sol : tapis et marquages peints.
  { id: "rug-war", kind: "rug", pos: { gx: 5.6, gy: 2.6 }, color: "#5EE7FF", size: 130 },
  { id: "rug-lounge", kind: "rug", pos: { gx: 2.1, gy: 7.9 }, color: "#A777FF", size: 116 },
  { id: "decal-desk", kind: "decal", pos: { gx: 2.6, gy: 4.0 }, label: "Desk 01" },
  { id: "decal-vault", kind: "decal", pos: { gx: 0.8, gy: 2.2 }, label: "Vault" },
  { id: "decal-gate", kind: "decal", pos: { gx: 6.7, gy: 7.8 }, label: "Secure Gate" },
  // Cloisons et zones bureau.
  { id: "glass-left", kind: "glass", pos: { gx: 1.2, gy: 2.4 }, size: 116 },
  { id: "glass-right", kind: "glass", pos: { gx: 7.0, gy: 2.0 }, size: 126 },
  { id: "gate", kind: "gate", pos: { gx: 6.2, gy: 7.0 } },
  // Open-space.
  { id: "office-desk", kind: "officeDesk", pos: { gx: 2.7, gy: 5.4 } },
  { id: "chair", kind: "chair", pos: { gx: 1.5, gy: 5.9 } },
  { id: "desk-b", kind: "desk", pos: { gx: 7.8, gy: 3.1 } },
  { id: "whiteboard", kind: "whiteboard", pos: { gx: 4.9, gy: 1.1 } },
  { id: "holo", kind: "holo", pos: { gx: 6.2, gy: 2.2 } },
  // Ops.
  { id: "vault", kind: "vault", pos: { gx: 0.7, gy: 1.5 } },
  { id: "server", kind: "server", pos: { gx: 8.5, gy: 5.8 } },
  { id: "kiosk", kind: "kiosk", pos: { gx: 5.4, gy: 6.2 } },
  { id: "cabinet", kind: "cabinet", pos: { gx: 8.9, gy: 1.2 } },
  { id: "shelf", kind: "shelf", pos: { gx: 0.8, gy: 4.0 } },
  // Cafétéria / lounge.
  { id: "cafe", kind: "cafe", pos: { gx: 7.8, gy: 8.5 } },
  { id: "fridge", kind: "fridge", pos: { gx: 9.1, gy: 7.7 } },
  { id: "stool-1", kind: "stool", pos: { gx: 6.9, gy: 9.0 } },
  { id: "stool-2", kind: "stool", pos: { gx: 7.8, gy: 9.4 } },
  { id: "sofa", kind: "sofa", pos: { gx: 2.0, gy: 8.7 } },
  // Verdure.
  { id: "plant-1", kind: "plant", pos: { gx: 0.9, gy: 0.9 } },
  { id: "plant-2", kind: "plant", pos: { gx: 9.1, gy: 1.0 } },
  { id: "plant-3", kind: "plant", pos: { gx: 0.8, gy: 6.6 } },
  { id: "plant-4", kind: "plant", pos: { gx: 5.6, gy: 9.4 } },
] as const;

const LED_COLORS = ["#3CDFA0", "#5EE7FF", "#3CDFA0", "#FFC94D", "#3CDFA0", "#5EE7FF", "#FF8A4C", "#3CDFA0", "#5EE7FF", "#3CDFA0", "#4D8DFF", "#3CDFA0"];
const LED_DELAYS = [0, 0.7, 1.3, 0.4, 1.9, 0.2, 1.1, 0.9, 1.6, 0.5, 1.4, 0.8];
const BAR_HEIGHTS = ["78%", "52%", "88%", "40%", "64%"];
const BAR_DELAYS = [0, 0.5, 0.2, 0.9, 0.35];
const LEAVES = [
  { rotate: -32, x: -7, y: -32 },
  { rotate: 0, x: -1, y: -36 },
  { rotate: 30, x: 5, y: -32 },
];

function PropBody({ spec }: { spec: PropSpec }) {
  switch (spec.kind) {
    case "officeDesk":
      return (
        <>
          <div className="prop-shadow" style={{ width: 126, height: 44, top: -15 }} />
          <div className="office-desk">
            <div className="office-monitor office-monitor--wide">
              <div className="code-screen" />
            </div>
            <div className="office-monitor office-monitor--side">
              <div className="code-screen code-screen--calm" />
            </div>
            <div className="office-lamp" />
            <div className="office-keyboard" />
            <div className="office-mouse" />
          </div>
        </>
      );
    case "chair":
      return (
        <>
          <div className="prop-shadow" style={{ width: 42, height: 18, top: -3 }} />
          <div className="office-chair" />
        </>
      );
    case "desk":
      return (
        <>
          <div className="prop-shadow" style={{ width: 96, height: 36, top: -14 }} />
          <div className="floor-refl floor-refl--monitor" />
          <div className="desk-top desk-top--under" />
          <div className="desk-top" />
          <div className="keyboard" />
          <div className="mug" />
          <div className="monitor monitor--side">
            <div className="code-screen code-screen--calm" />
          </div>
          <div className="monitor">
            <div className="code-screen" />
          </div>
        </>
      );
    case "vault":
      return (
        <>
          <div className="prop-shadow" style={{ width: 58, height: 24, top: -5 }} />
          <div className="vault">
            <span className="vault-shelf" />
            <span className="vault-shelf" />
            <span className="vault-door" />
          </div>
        </>
      );
    case "server":
      return (
        <>
          <div className="prop-shadow" style={{ width: 46, height: 18, top: -4 }} />
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
    case "whiteboard":
      return (
        <>
          <div className="prop-shadow" style={{ width: 88, height: 18, top: -2 }} />
          <div className="whiteboard">
            <span className="wb-title">Workflow</span>
            <span className="wb-line wb-line--a" />
            <span className="wb-line wb-line--b" />
            <span className="wb-card wb-card--one" />
            <span className="wb-card wb-card--two" />
          </div>
        </>
      );
    case "glass":
      return (
        <div
          className="glass-partition"
          style={{ "--glass-w": `${spec.size ?? 110}px` } as CSSProperties}
        />
      );
    case "gate":
      return (
        <>
          <div className="prop-shadow" style={{ width: 92, height: 18, top: -2 }} />
          <div className="security-gate">
            <span />
            <span />
          </div>
        </>
      );
    case "cabinet":
      return (
        <>
          <div className="prop-shadow" style={{ width: 38, height: 14, top: -3 }} />
          <div className="cabinet" />
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
    case "cafe":
      return (
        <>
          <div className="prop-shadow" style={{ width: 100, height: 34, top: -12 }} />
          <div className="floor-refl floor-refl--coffee" />
          <div className="counter-top counter-top--under" />
          <div className="counter-top" />
          <div className="coffee">
            {[0, 0.9, 1.7].map((d, i) => (
              <span key={i} className="steam" style={{ "--delay": `${d}s` } as CSSProperties} />
            ))}
          </div>
          <div className="cafe-mug" style={{ left: 6, top: -58 }} />
          <div className="cafe-mug" style={{ left: 18, top: -54 }} />
        </>
      );
    case "fridge":
      return (
        <>
          <div className="prop-shadow" style={{ width: 34, height: 13, top: -3 }} />
          <div className="fridge" />
        </>
      );
    case "stool":
      return (
        <>
          <div className="prop-shadow" style={{ width: 24, height: 9, top: -2 }} />
          <div className="stool-leg" />
          <div className="stool-seat" />
        </>
      );
    case "sofa":
      return (
        <>
          <div className="prop-shadow" style={{ width: 76, height: 22, top: -4 }} />
          <div className="sofa-back" />
          <div className="sofa-arm sofa-arm--l" />
          <div className="sofa-arm sofa-arm--r" />
          <div className="sofa-base" />
        </>
      );
    case "shelf":
      return (
        <>
          <div className="prop-shadow" style={{ width: 40, height: 14, top: -3 }} />
          <div className="shelf">
            <div className="shelf-row" />
            <div className="shelf-row" />
            <div className="shelf-row" />
          </div>
        </>
      );
    case "rug":
      return (
        <div
          className="rug"
          style={
            {
              "--rug-c": spec.color ?? "#5EE7FF",
              "--rug-s": `${spec.size ?? 100}px`,
            } as CSSProperties
          }
        />
      );
    case "decal":
      return <span className="floor-decal">{spec.label}</span>;
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

/** Tapis et marquages restent collés au sol, sous les agents. */
const FLOOR_KINDS: ReadonlySet<PropKind> = new Set(["rug", "decal"]);

export function Prop({ spec, index = 0 }: { spec: PropSpec; index?: number }) {
  const p = project(spec.pos);
  return (
    <div
      className="prop"
      style={{
        transform: `translate3d(${p.x}px, ${p.y}px, 0)`,
        zIndex: FLOOR_KINDS.has(spec.kind) ? 5 : 10 + depth(spec.pos),
        ["--enter-delay" as string]: `${index * 0.07}s`,
      }}
    >
      <PropBody spec={spec} />
    </div>
  );
}
