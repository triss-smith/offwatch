import type { Goal } from "@offwatch/shared";
import { api } from "./client";

export const goalsApi = {
  list: (workspaceId: string) => api.get<Goal[]>(`/workspaces/${workspaceId}/goals`),
  get: (id: string) => api.get<Goal>(`/goals/${id}`),
  create: (workspaceId: string, data: Record<string, unknown>) =>
    api.post<Goal>(`/workspaces/${workspaceId}/goals`, data),
  update: (id: string, data: Record<string, unknown>) => api.patch<Goal>(`/goals/${id}`, data),
  remove: (id: string) => api.delete<Goal>(`/goals/${id}`),
};
