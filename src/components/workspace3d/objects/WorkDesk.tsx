"use client";

import { RoundedBox } from "@react-three/drei";

export function WorkDeskModel() {
  return (
    <group>
      <RoundedBox args={[1.75, 0.18, 0.88]} radius={0.08} smoothness={8} position={[0, 0.48, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#c69057" roughness={0.48} />
      </RoundedBox>
      <RoundedBox args={[1.55, 0.26, 0.62]} radius={0.06} smoothness={6} position={[0, 0.28, 0]} castShadow>
        <meshStandardMaterial color="#6b4425" roughness={0.58} />
      </RoundedBox>
      <RoundedBox args={[0.78, 0.06, 0.5]} radius={0.035} smoothness={6} position={[-0.28, 1.02, -0.18]} rotation={[0.12, 0, 0]} castShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.035, 0.36]} radius={0.022} smoothness={4} position={[-0.28, 1.02, -0.215]} rotation={[0.12, 0, 0]} castShadow>
        <meshStandardMaterial color="#08111f" emissive="#0f172a" roughness={0.32} />
      </RoundedBox>
      {[0, 1, 2].map((line) => (
        <RoundedBox key={line} args={[0.34 - line * 0.06, 0.012, 0.018]} radius={0.004} position={[-0.34, 1.04 - line * 0.07, -0.24]} rotation={[0.12, 0, 0]}>
          <meshStandardMaterial color={line === 1 ? "#f97316" : "#22d3ee"} emissive={line === 1 ? "#f97316" : "#22d3ee"} emissiveIntensity={0.8} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.42, 0.04, 0.14]} radius={0.02} smoothness={5} position={[0.28, 0.62, 0.18]} castShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0.64, 0.64, -0.2]} castShadow>
        <cylinderGeometry args={[0.08, 0.07, 0.16, 24]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.42} />
      </mesh>
      <mesh position={[0.66, 0.76, -0.2]} castShadow>
        <sphereGeometry args={[0.08, 24, 12]} />
        <meshStandardMaterial color="#22c55e" roughness={0.55} />
      </mesh>
      <RoundedBox args={[0.48, 0.1, 0.42]} radius={0.08} smoothness={8} position={[-0.42, 0.26, 0.86]} castShadow>
        <meshStandardMaterial color="#38bdf8" roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.08, 0.5]} radius={0.08} smoothness={8} position={[-0.42, 0.68, 1.04]} rotation={[0.2, 0, 0]} castShadow>
        <meshStandardMaterial color="#7dd3fc" roughness={0.35} />
      </RoundedBox>
    </group>
  );
}
