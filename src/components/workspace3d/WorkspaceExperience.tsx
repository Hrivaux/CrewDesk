"use client";

import { WorkspaceCanvas } from "@/components/workspace3d/WorkspaceCanvas";
import { ObjectLibrary } from "@/components/workspace3d/ui/ObjectLibrary";
import { InspectorPanel } from "@/components/workspace3d/ui/InspectorPanel";
import { WorkspaceHud } from "@/components/workspace3d/ui/WorkspaceHud";

export function WorkspaceExperience() {
  return (
    <section className="relative h-[calc(100dvh-5.75rem)] min-h-[640px] overflow-hidden rounded-[28px] border border-white/70 bg-[#edf4fb] shadow-[0_28px_100px_rgba(15,23,42,0.18)] md:min-h-[720px]">
      <WorkspaceCanvas />
      <div className="pointer-events-none absolute inset-0 z-10 flex gap-4 p-4">
        <ObjectLibrary />
        <div className="min-w-0 flex-1" />
        <InspectorPanel />
      </div>
      <WorkspaceHud />
    </section>
  );
}
