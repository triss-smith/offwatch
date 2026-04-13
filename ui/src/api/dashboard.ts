import type { DashboardSummary } from "@paperclipai/shared";
import { api } from "./client";

export const dashboardApi = {
  summary: (workspaceId: string) => api.get<DashboardSummary>(`/workspaces/${workspaceId}/dashboard`),
};
