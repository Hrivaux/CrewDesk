"use client";

import { Html } from "@react-three/drei";

export function FloatingLabel({
  position,
  children,
  muted,
  onClick,
}: {
  position: [number, number, number];
  children: React.ReactNode;
  muted?: boolean;
  onClick?: () => void;
}) {
  return (
    <Html position={position} center occlude={false} style={{ pointerEvents: onClick ? "auto" : "none" }}>
      <button
        type="button"
        className={`scene3d-label ${muted ? "scene3d-label--muted" : ""} ${onClick ? "scene3d-label--button" : ""}`}
        onPointerDown={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
      >
        {children}
      </button>
    </Html>
  );
}
