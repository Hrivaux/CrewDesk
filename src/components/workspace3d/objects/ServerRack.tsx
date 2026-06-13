"use client";

import { RoundedBox } from "@react-three/drei";

export function ServerRackModel() {
  return (
    <group>
      <RoundedBox args={[0.74, 0.82, 1.2]} radius={0.07} smoothness={8} position={[0, 0.62, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#111827" roughness={0.38} metalness={0.12} />
      </RoundedBox>
      <RoundedBox args={[0.55, 0.04, 0.92]} radius={0.035} smoothness={6} position={[0, 0.66, -0.43]} castShadow>
        <meshStandardMaterial color="#020617" roughness={0.32} />
      </RoundedBox>
      {[0, 1, 2, 3, 4].map((index) => (
        <RoundedBox key={index} args={[0.34 - index * 0.025, 0.016, 0.026]} radius={0.004} position={[0, 1.02 - index * 0.15, -0.47]}>
          <meshStandardMaterial color={index % 2 ? "#22c55e" : "#22d3ee"} emissive={index % 2 ? "#22c55e" : "#22d3ee"} emissiveIntensity={0.75} />
        </RoundedBox>
      ))}
      <mesh position={[0.29, 0.2, -0.48]} castShadow>
        <sphereGeometry args={[0.035, 18, 10]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.1} />
      </mesh>
      <RoundedBox args={[0.62, 0.44, 0.06]} radius={0.035} smoothness={6} position={[0, 0.08, 0.44]} castShadow>
        <meshStandardMaterial color="#e2e8f0" roughness={0.42} />
      </RoundedBox>
    </group>
  );
}
