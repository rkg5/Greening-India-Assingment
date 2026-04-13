import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

export const useProjects = () =>
  useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects").then((r) => r.data.projects),
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post("/projects", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useUpdateProject = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      api.patch(`/projects/${projectId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        toast.error("Only the project owner can edit this project.");
      } else {
        toast.error("Failed to update project.");
      }
    },
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.delete(`/projects/${projectId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        toast.error("Only the project owner can delete this project.");
      } else {
        toast.error("Failed to delete project.");
      }
    },
  });
};

export const useProjectStats = (projectId: string) =>
  useQuery({
    queryKey: ["projects", projectId, "stats"],
    queryFn: () => api.get(`/projects/${projectId}/stats`).then((r) => r.data),
    enabled: !!projectId,
  });
