import type {
  Workspace,
  CompanyPortabilityExportRequest,
  CompanyPortabilityExportPreviewResult,
  CompanyPortabilityExportResult,
  CompanyPortabilityImportRequest,
  CompanyPortabilityImportResult,
  CompanyPortabilityPreviewRequest,
  CompanyPortabilityPreviewResult,
  UpdateCompanyBranding,
} from "@paperclipai/shared";
import { api } from "./client";

export type CompanyStats = Record<string, { agentCount: number; issueCount: number }>;

export const workspacesApi = {
  list: () => api.get<Workspace[]>("/workspaces"),
  get: (workspaceId: string) => api.get<Workspace>(`/workspaces/${workspaceId}`),
  stats: () => api.get<CompanyStats>("/workspaces/stats"),
  create: (data: {
    name: string;
    description?: string | null;
    budgetMonthlyCents?: number;
  }) =>
    api.post<Workspace>("/workspaces", data),
  update: (
    workspaceId: string,
    data: Partial<
      Pick<
        Workspace,
        | "name"
        | "description"
        | "status"
        | "budgetMonthlyCents"
        | "requireBoardApprovalForNewAgents"
        | "feedbackDataSharingEnabled"
        | "brandColor"
        | "logoAssetId"
        | "budgetMetric"
      >
    >,
  ) => api.patch<Workspace>(`/workspaces/${workspaceId}`, data),
  updateBranding: (workspaceId: string, data: UpdateCompanyBranding) =>
    api.patch<Workspace>(`/workspaces/${workspaceId}/branding`, data),
  archive: (workspaceId: string) => api.post<Workspace>(`/workspaces/${workspaceId}/archive`, {}),
  remove: (workspaceId: string) => api.delete<{ ok: true }>(`/workspaces/${workspaceId}`),
  exportBundle: (
    workspaceId: string,
    data: CompanyPortabilityExportRequest,
  ) =>
    api.post<CompanyPortabilityExportResult>(`/workspaces/${workspaceId}/export`, data),
  exportPreview: (
    workspaceId: string,
    data: CompanyPortabilityExportRequest,
  ) =>
    api.post<CompanyPortabilityExportPreviewResult>(`/workspaces/${workspaceId}/exports/preview`, data),
  exportPackage: (
    workspaceId: string,
    data: CompanyPortabilityExportRequest,
  ) =>
    api.post<CompanyPortabilityExportResult>(`/workspaces/${workspaceId}/exports`, data),
  importPreview: (data: CompanyPortabilityPreviewRequest) =>
    api.post<CompanyPortabilityPreviewResult>("/workspaces/import/preview", data),
  importBundle: (data: CompanyPortabilityImportRequest) =>
    api.post<CompanyPortabilityImportResult>("/workspaces/import", data),
};
