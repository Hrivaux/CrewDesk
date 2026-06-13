"use client";

import { WorkspaceCanvas } from "@/components/workspace3d/WorkspaceCanvas";
import { OrchestratorPanel } from "@/components/workspace3d/ui/OrchestratorPanel";
import { WorkspaceHud } from "@/components/workspace3d/ui/WorkspaceHud";

/**
 * Default Scène view: the pre-configured Blender board running in "play"
 * mode — objects are fixed, agents take tasks from the orchestrator panel.
 * Object editing lives on the Configurer page.
 */
export function WorkspaceShowcase() {
  return (
    <section className="relative h-[calc(100dvh-5.75rem)] min-h-[640px] overflow-hidden rounded-[28px] border border-white/70 bg-[#edf4fb] shadow-[0_28px_100px_rgba(15,23,42,0.18)] md:min-h-[720px]">
      <WorkspaceCanvas mode="play" />
      <OrchestratorPanel />
      <WorkspaceHud />
    </section>
  );
}
