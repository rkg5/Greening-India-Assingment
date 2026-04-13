import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Project, TaskStatus, TaskPriority } from "@/types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  assignee_id?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  assignee_id?: string | null;
  assignee_name?: string | null; // For optimistic update
  assignee_email?: string | null; // For optimistic update
}

export const useProject = (projectId: string) =>
  useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  });

export const useCreateTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) =>
      api.post(`/projects/${projectId}/tasks`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useUpdateTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskInput }) => {
      // Remove assignee_name/email before sending to API
      const payload = { ...data };
      delete payload.assignee_name;
      delete payload.assignee_email;
      return api.patch(`/tasks/${taskId}`, payload).then((r) => r.data);
    },

    onMutate: async ({ taskId, data }) => {
      await qc.cancelQueries({ queryKey: ["projects", projectId] });
      const previous = qc.getQueryData(["projects", projectId]);
      qc.setQueryData(["projects", projectId], (old: Project | undefined) => {
        if (!old || !old.tasks) return old;
        return {
          ...old,
          tasks: old.tasks.map((t) =>
            t.id === taskId ? { ...t, ...data } : t
          ),
        };
      });
      return { previous };
    },

    onError: (err: unknown, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["projects", projectId], context.previous);
      }
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        toast.error("You do not have permission to do that.");
      } else {
        toast.error("Failed to update task. Changes reverted.");
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useDeleteTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        toast.error("You do not have permission to do that.");
      } else {
        toast.error("Failed to delete task.");
      }
    },
  });
};
