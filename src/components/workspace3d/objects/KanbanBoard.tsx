"use client";

import { RoundedBox } from "@react-three/drei";

export function KanbanBoardModel() {
  return (
    <group>
      <RoundedBox args={[1.78, 0.08, 1.08]} radius={0.055} smoothness={8} position={[0, 0.92, -0.05]} castShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.42} />
      </RoundedBox>
      <RoundedBox args={[1.58, 0.03, 0.86]} radius={0.035} smoothness={6} position={[0, 0.92, -0.1]}>
        <meshStandardMaterial color="#0f172a" roughness={0.35} />
      </RoundedBox>
      {[-0.48, 0, 0.48].map((x, column) => (
        <group key={x}>
          <RoundedBox args={[0.36, 0.014, 0.026]} radius={0.004} position={[x, 1.25, -0.125]}>
            <meshStandardMaterial color={["#38bdf8", "#f97316", "#22c55e"][column]} emissive={["#38bdf8", "#f97316", "#22c55e"][column]} emissiveIntensity={0.65} />
          </RoundedBox>
          {[0, 1, 2].map((row) => (
            <RoundedBox key={row} args={[0.34, 0.018, 0.11]} radius={0.012} position={[x, 1.08 - row * 0.19, -0.13]}>
              <meshStandardMaterial color={["#e0f2fe", "#fed7aa", "#bbf7d0"][(row + column) % 3]} roughness={0.48} />
            </RoundedBox>
          ))}
        </group>
      ))}
      <RoundedBox args={[1.54, 0.08, 0.08]} radius={0.035} smoothness={6} position={[0, 0.08, 0.16]}>
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.18} />
      </RoundedBox>
    </group>
  );
}
