import type {
  Workspace,
  WorkspacePortabilityExportRequest,
  WorkspacePortabilityExportPreviewResult,
  WorkspacePortabilityExportResult,
  WorkspacePortabilityImportRequest,
  WorkspacePortabilityImportResult,
  WorkspacePortabilityPreviewRequest,
  WorkspacePortabilityPreviewResult,
} from "@paperclipai/shared";
import type { UpdateWorkspaceBranding } from "@paperclipai/shared";
import { api } from "./client";

export type CompanyStats = Record<string, { agentCount: number; issueCount: number }>;

export const workspacesApi = {
  list: () => api.get<Workspace[]>("/workspaces"),
  get: (workspaceId: string) => api.get<Workspace>(`/workspaces/${workspaceId}`),
  stats: () => api.get<CompanyStats>("/workspaces/stats"),
  create: (data: { name: string }) =>
    api.post<Workspace>("/workspaces", data),
  update: (
    workspaceId: string,
    data: Partial<
      Pick<
        Workspace,
        | "name"
        | "status"
        | "requireBoardApprovalForNewAgents"
        | "brandColor"
        | "issueTrackerConfig"
        | "repoPath"
        | "worktreesPath"
      >
    >,
  ) => api.patch<Workspace>(`/workspaces/${workspaceId}`, data),
  updateBranding: (workspaceId: string, data: UpdateWorkspaceBranding) =>
    api.patch<Workspace>(`/workspaces/${workspaceId}/branding`, data),
  archive: (workspaceId: string) => api.post<Workspace>(`/workspaces/${workspaceId}/archive`, {}),
  remove: (workspaceId: string) => api.delete<{ ok: true }>(`/workspaces/${workspaceId}`),
  exportBundle: (
    workspaceId: string,
    data: WorkspacePortabilityExportRequest,
  ) =>
    api.post<WorkspacePortabilityExportResult>(`/workspaces/${workspaceId}/export`, data),
  exportPreview: (
    workspaceId: string,
    data: WorkspacePortabilityExportRequest,
  ) =>
    api.post<WorkspacePortabilityExportPreviewResult>(`/workspaces/${workspaceId}/exports/preview`, data),
  exportPackage: (
    workspaceId: string,
    data: WorkspacePortabilityExportRequest,
  ) =>
    api.post<WorkspacePortabilityExportResult>(`/workspaces/${workspaceId}/exports`, data),
  importPreview: (data: WorkspacePortabilityPreviewRequest) =>
    api.post<WorkspacePortabilityPreviewResult>("/workspaces/import/preview", data),
  importBundle: (data: WorkspacePortabilityImportRequest) =>
    api.post<WorkspacePortabilityImportResult>("/workspaces/import", data),
};
