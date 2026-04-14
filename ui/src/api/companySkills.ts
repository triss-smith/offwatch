import type {
  WorkspaceSkill,
  WorkspaceSkillCreateRequest,
  WorkspaceSkillDetail,
  WorkspaceSkillFileDetail,
  WorkspaceSkillImportResult,
  WorkspaceSkillListItem,
  WorkspaceSkillProjectScanRequest,
  WorkspaceSkillProjectScanResult,
  WorkspaceSkillUpdateStatus,
} from "@paperclipai/shared";
import { api } from "./client";

export const companySkillsApi = {
  list: (workspaceId: string) =>
    api.get<WorkspaceSkillListItem[]>(`/workspaces/${encodeURIComponent(workspaceId)}/skills`),
  detail: (workspaceId: string, skillId: string) =>
    api.get<WorkspaceSkillDetail>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}`,
    ),
  updateStatus: (workspaceId: string, skillId: string) =>
    api.get<WorkspaceSkillUpdateStatus>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}/update-status`,
    ),
  file: (workspaceId: string, skillId: string, relativePath: string) =>
    api.get<WorkspaceSkillFileDetail>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}/files?path=${encodeURIComponent(relativePath)}`,
    ),
  updateFile: (workspaceId: string, skillId: string, path: string, content: string) =>
    api.patch<WorkspaceSkillFileDetail>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}/files`,
      { path, content },
    ),
  create: (workspaceId: string, payload: WorkspaceSkillCreateRequest) =>
    api.post<WorkspaceSkill>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills`,
      payload,
    ),
  importFromSource: (workspaceId: string, source: string) =>
    api.post<WorkspaceSkillImportResult>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/import`,
      { source },
    ),
  scanProjects: (workspaceId: string, payload: WorkspaceSkillProjectScanRequest = {}) =>
    api.post<WorkspaceSkillProjectScanResult>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/scan-projects`,
      payload,
    ),
  installUpdate: (workspaceId: string, skillId: string) =>
    api.post<WorkspaceSkill>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}/install-update`,
      {},
    ),
  delete: (workspaceId: string, skillId: string) =>
    api.delete<WorkspaceSkill>(
      `/workspaces/${encodeURIComponent(workspaceId)}/skills/${encodeURIComponent(skillId)}`,
    ),
};
