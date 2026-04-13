import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import EmptyState from "@/components/common/EmptyState";
import TaskCard from "@/components/tasks/TaskCard";
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskPanel from "@/components/tasks/TaskPanel";
import EditProjectDialog from "@/components/projects/EditProjectDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProject, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useDeleteProject, useProjectStats } from "@/hooks/useProjects";
import type { Task, TaskStatus } from "@/types";
import { STATUS_LABELS } from "@/types";

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  // Incremented each time the panel opens so TaskPanel remounts with fresh state.
  const [panelKey, setPanelKey] = useState(0);

  const { user } = useAuth();
  const { data: project, isLoading, isError, refetch } = useProject(projectId!);
  const { data: stats } = useProjectStats(projectId!);
  const updateTask = useUpdateTask(projectId!);
  const deleteTask = useDeleteTask(projectId!);
  const deleteProject = useDeleteProject();

  const isOwner = project?.owner_id === user?.id;

  const tasks: Task[] = project?.tasks ?? [];
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (assignedToMe && t.assignee_id !== user?.id) return false;
    return true;
  });

  function openCreate() {
    setEditingTask(undefined);
    setPanelKey((k) => k + 1);
    setPanelOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setPanelKey((k) => k + 1);
    setPanelOpen(true);
  }

  function handleDeleteProject() {
    deleteProject.mutate(projectId!, {
      onSuccess: () => navigate("/"),
    });
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Projects
          </Link>
        </div>

        {isLoading && <LoadingSpinner />}

        {isError && !isLoading && (
          <ErrorMessage
            message="Failed to load project"
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && project && (
          <>
            <div className="mb-6 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                {project.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
              </div>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="shrink-0 mt-1" aria-label="Project actions" />
                    }
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditProjectOpen(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit project
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteProjectOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Stats bar — bonus */}
            {stats && (
              <div className="mb-6 flex gap-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Tasks:</span>
                <span>{stats.task_counts.todo} todo</span>
                <span className="text-blue-600 dark:text-blue-400">{stats.task_counts.in_progress} in progress</span>
                <span className="text-green-600 dark:text-green-400">{stats.task_counts.done} done</span>
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <TaskFilters
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                assignedToMe={assignedToMe}
                onAssignedToMeChange={setAssignedToMe}
              />
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" />
                Add Task
              </Button>
            </div>

            {filteredTasks.length === 0 ? (
              statusFilter !== "all" || assignedToMe ? (
                <EmptyState
                  title="No tasks match this filter"
                  description={
                    assignedToMe && statusFilter !== "all"
                      ? `No tasks assigned to you with status "${STATUS_LABELS[statusFilter as TaskStatus]}"`
                      : assignedToMe
                        ? "No tasks assigned to you"
                        : `No tasks with status "${STATUS_LABELS[statusFilter as TaskStatus]}"`
                  }
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setStatusFilter("all"); setAssignedToMe(false); }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  title="No tasks yet"
                  description="Add a task to get started"
                  action={
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="mr-1 h-4 w-4" />
                      Add Task
                    </Button>
                  }
                />
              )
            ) : (
              <div className="flex flex-col gap-3">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEdit}
                    onDelete={(id) => deleteTask.mutate(id)}
                    isDeleting={deleteTask.isPending}
                    onStatusChange={(id, status) =>
                      updateTask.mutate({ taskId: id, data: { status } })
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <TaskPanel
        key={panelKey}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        projectId={projectId!}
        task={editingTask}
      />

      {project && (
        <EditProjectDialog
          open={editProjectOpen}
          onOpenChange={setEditProjectOpen}
          project={project}
        />
      )}

      <AlertDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              "{project?.name}" and all its tasks will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProject.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProject.isPending}
              onClick={handleDeleteProject}
            >
              {deleteProject.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
