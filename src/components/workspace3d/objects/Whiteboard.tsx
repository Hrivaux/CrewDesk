"use client";

import { RoundedBox } from "@react-three/drei";

export function WhiteboardModel() {
  return (
    <group>
      <RoundedBox args={[1.68, 0.08, 1.08]} radius={0.055} smoothness={8} position={[0, 0.95, -0.06]} castShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.38} />
      </RoundedBox>
      <RoundedBox args={[1.5, 0.035, 0.88]} radius={0.035} smoothness={6} position={[0, 0.95, -0.11]} castShadow>
        <meshStandardMaterial color="#eff6ff" roughness={0.46} />
      </RoundedBox>
      {[0, 1, 2].map((index) => (
        <RoundedBox key={index} args={[0.34, 0.018, 0.14]} radius={0.016} position={[-0.46 + index * 0.44, 1.16 - index * 0.08, -0.14]}>
          <meshStandardMaterial color={["#fde68a", "#bfdbfe", "#fecdd3"][index]} roughness={0.48} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.82, 0.014, 0.018]} radius={0.004} position={[-0.18, 0.82, -0.15]}>
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.55} />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.014, 0.018]} radius={0.004} position={[0.08, 0.72, -0.15]}>
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
      </RoundedBox>
      <mesh position={[-0.62, 0.38, 0.16]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.78, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.24} />
      </mesh>
      <mesh position={[0.62, 0.38, 0.16]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.78, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.24} />
      </mesh>
      <RoundedBox args={[1.46, 0.08, 0.08]} radius={0.035} smoothness={6} position={[0, 0.09, 0.16]} castShadow>
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </RoundedBox>
    </group>
  );
}
