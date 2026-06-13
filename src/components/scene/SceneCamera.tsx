"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export function SceneCamera({ zoom }: { zoom: number }) {
  const camera = useThree((state) => state.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const userActive = useRef(false);

  useEffect(() => {
    camera.position.set(7.2, 7.4, 7.2);
    camera.lookAt(0, 0.22, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    if ("zoom" in camera) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }, [camera, zoom]);

  // Dérive douce au repos : la scène respire ; toute interaction la suspend.
  useFrame(({ clock }, delta) => {
    const c = controls.current;
    if (!c || userActive.current) return;
    c.setAzimuthalAngle(c.getAzimuthalAngle() + Math.sin(clock.elapsedTime * 0.12) * delta * 0.045);
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableRotate
      enableZoom
      onStart={() => {
        userActive.current = true;
      }}
      onEnd={() => {
        userActive.current = false;
      }}
      minPolarAngle={0.72}
      maxPolarAngle={1.08}
      minAzimuthAngle={-Math.PI / 4}
      maxAzimuthAngle={Math.PI / 4}
      minZoom={48}
      maxZoom={140}
      target={[0, 0.18, 0.2]}
      screenSpacePanning={false}
    />
  );
}
