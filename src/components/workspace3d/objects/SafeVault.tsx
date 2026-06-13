"use client";

import { RoundedBox } from "@react-three/drei";

export function SafeVaultModel() {
  return (
    <group>
      <RoundedBox args={[0.9, 0.92, 0.78]} radius={0.08} smoothness={8} position={[0, 0.48, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#64748b" roughness={0.42} metalness={0.25} />
      </RoundedBox>
      <RoundedBox args={[0.68, 0.08, 0.56]} radius={0.05} smoothness={6} position={[0, 0.52, -0.42]} castShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.38} metalness={0.18} />
      </RoundedBox>
      <mesh position={[0, 0.56, -0.47]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.17, 0.018, 12, 48]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.65} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.56, -0.49]} castShadow>
        <sphereGeometry args={[0.055, 24, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.1} />
      </mesh>
      {[0, 1, 2].map((index) => (
        <RoundedBox key={index} args={[0.4, 0.018, 0.024]} radius={0.004} position={[0, 0.82 - index * 0.13, -0.49]}>
          <meshStandardMaterial color={index === 1 ? "#f97316" : "#22d3ee"} emissive={index === 1 ? "#f97316" : "#22d3ee"} emissiveIntensity={0.6} />
        </RoundedBox>
      ))}
    </group>
  );
}
