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
        material.toneMapped = false;
        material.emissiveIntensity = Math.max(material.emissiveIntensity ?? 1, 1.1);
      } else {
        material.roughness = Math.min(material.roughness ?? 0.6, 0.34);
        material.metalness = Math.max(material.metalness ?? 0, 0.04);
        material.envMapIntensity = 0.95;
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
