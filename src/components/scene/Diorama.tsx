"use client";

import dynamic from "next/dynamic";

const CrewDeskThreeScene = dynamic(
  () => import("@/components/scene/CrewDeskThreeScene").then((mod) => mod.CrewDeskThreeScene),
  {
    ssr: false,
    loading: () => (
      <div className="scene3d-loading">
        <div className="scene3d-loading-core" />
      </div>
    ),
  },
);

export function Diorama() {
  return <CrewDeskThreeScene />;
}
