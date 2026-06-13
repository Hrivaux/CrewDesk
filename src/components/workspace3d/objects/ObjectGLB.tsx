"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { WorkspaceObjectType } from "@/types/workspace";

const OBJECT_MODEL_PATHS: Record<WorkspaceObjectType, string> = {
  desk: "/assets/models/objects/desk.glb",
  whiteboard: "/assets/models/objects/whiteboard.glb",
  vault: "/assets/models/objects/vault.glb",
  kanban: "/assets/models/objects/kanban.glb",
  server: "/assets/models/objects/server.glb",
  meeting: "/assets/models/objects/meeting.glb",
  plant: "/assets/models/objects/plant.glb",
  lamp: "/assets/models/objects/lamp.glb",
};

/**
 * Loads a Blender-authored placeable object (GLB) and gives it the glossy
 * "candy plastic" finish seen in the reference: lower roughness, a touch of
 * metalness and stronger environment reflections. Emissive accents (data
 * lines, glows) are left untouched so they keep popping under the bloom pass.
 */
export function ObjectGLB({ type }: { type: WorkspaceObjectType }) {
  const gltf = useGLTF(OBJECT_MODEL_PATHS[type]);

  const model = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const polish = (source: THREE.Material): THREE.Material => {
      if (!(source instanceof THREE.MeshStandardMaterial)) return source;
      const material = source.clone();
      const isEmissive = material.emissive.getHexString() !== "000000";
      if (isEmissive) {
        material.emissiveIntensity = Math.min(material.emissiveIntensity ?? 1, 0.7);
      } else {
        material.roughness = Math.max(material.roughness ?? 0.6, 0.5);
        material.metalness = 0;
        material.envMapIntensity = 0.4;
      }
      material.needsUpdate = true;
      return material;
    };
    cloned.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      object.material = Array.isArray(object.material)
        ? object.material.map(polish)
        : polish(object.material);
    });
    return cloned;
  }, [gltf.scene]);

  return <primitive object={model} />;
}

Object.values(OBJECT_MODEL_PATHS).forEach((path) => useGLTF.preload(path));
