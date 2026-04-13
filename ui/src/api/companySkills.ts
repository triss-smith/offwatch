import type {
  CompanySkill,
  CompanySkillCreateRequest,
  CompanySkillDetail,
  CompanySkillFileDetail,
  CompanySkillImportResult,
  CompanySkillListItem,
  CompanySkillProjectScanRequest,
  CompanySkillProjectScanResult,
  CompanySkillUpdateStatus,
} from "@paperclipai/shared";
import { api } from "./client";

export const companySkillsApi = {
  list: (workspaceId: string) =>
    api.get<CompanySkillListItem[]>(`/workspaces/${encodeURIComponent(workspaceId)}/skills`),
  detail: (workspaceId: string, skillId: string) =>
    api.get<CompanySkillDetail>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}`,
    ),
  updateStatus: (workspaceId: string, skillId: string) =>
    api.get<CompanySkillUpdateStatus>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}/update-status`,
    ),
  file: (workspaceId: string, skillId: string, relativePath: string) =>
    api.get<CompanySkillFileDetail>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}/files?path=${encodeURIComponent(relativePath)}`,
    ),
  updateFile: (workspaceId: string, skillId: string, path: string, content: string) =>
    api.patch<CompanySkillFileDetail>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}/files`,
      { path, content },
    ),
  create: (workspaceId: string, payload: CompanySkillCreateRequest) =>
    api.post<CompanySkill>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills`,
      payload,
    ),
  importFromSource: (workspaceId: string, source: string) =>
    api.post<CompanySkillImportResult>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/import`,
      { source },
    ),
  scanProjects: (workspaceId: string, payload: CompanySkillProjectScanRequest = {}) =>
    api.post<CompanySkillProjectScanResult>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/scan-projects`,
      payload,
    ),
  installUpdate: (workspaceId: string, skillId: string) =>
    api.post<CompanySkill>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}/install-update`,
      {},
    ),
  delete: (workspaceId: string, skillId: string) =>
    api.delete<CompanySkill>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}`,
    ),
};
