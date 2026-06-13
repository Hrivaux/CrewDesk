"use client";

import { TopBar } from "@/components/hud/TopBar";
import { WorkspaceExperience } from "@/components/workspace3d/WorkspaceExperience";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="min-h-0 flex-1 p-3">
        <WorkspaceExperience />
      </main>
    </div>
  );
}
