"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export function SceneCamera({ zoom }: { zoom: number }) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(7.2, 7.4, 7.2);
    camera.lookAt(0, 0.16, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    if ("zoom" in camera) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }, [camera, zoom]);

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableRotate
      enableZoom
      minPolarAngle={0.72}
      maxPolarAngle={1.08}
      minAzimuthAngle={-Math.PI / 4}
      maxAzimuthAngle={Math.PI / 4}
      minZoom={48}
      maxZoom={118}
      target={[0, 0.1, 0.2]}
      screenSpacePanning={false}
    />
  );
}
