import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import EmptyState from "@/components/common/EmptyState";
import ProjectCard from "@/components/projects/ProjectCard";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { data: projects, isLoading, isError, refetch } = useProjects();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
          <Button onClick={() => setDialogOpen(true)}>New Project</Button>
        </div>

        {isLoading && <LoadingSpinner />}

        {isError && (
          <ErrorMessage
            message="Failed to load projects"
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && projects?.length === 0 && (
          <EmptyState
            title="No projects yet"
            description="Create your first project to get started"
            action={
              <Button onClick={() => setDialogOpen(true)}>Create Project</Button>
            }
          />
        )}

        {!isLoading && !isError && projects && projects.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: Project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}

        <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </main>
    </div>
  );
}
