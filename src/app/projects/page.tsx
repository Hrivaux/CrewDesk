"use client";

import { TopBar } from "@/components/hud/TopBar";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useMounted } from "@/lib/useMounted";
import { useCrewStore } from "@/stores/useCrewStore";

export default function ProjectsPage() {
  const mounted = useMounted();
  const projects = useCrewStore((s) => s.projects);
  const tasks = useCrewStore((s) => s.tasks);

  return (
    <div className="flex h-dvh flex-col">
      <TopBar />
      <main className="thin-scroll min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto grid w-full max-w-4xl gap-4 md:grid-cols-2">
          {mounted
            ? projects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  tasks={tasks.filter((t) => t.projectId === project.id)}
                  index={i}
                />
              ))
            : null}
        </div>
        {mounted && projects.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted">
            Aucun projet pour l&apos;instant — la simulation va en créer.
          </p>
        ) : null}
      </main>
    </div>
  );
}
