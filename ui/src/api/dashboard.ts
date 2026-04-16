import type { DashboardSummary } from "@offwatch/shared";
import { api } from "./client";

export const dashboardApi = {
  summary: (workspaceId: string) => api.get<DashboardSummary>(`/workspaces/${workspaceId}/dashboard`),
};
