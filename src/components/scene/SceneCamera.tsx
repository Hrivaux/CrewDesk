"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

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

  return null;
}
