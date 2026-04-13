import type { Project, ProjectWorkspace, WorkspaceOperation } from "@paperclipai/shared";
import { api } from "./client";

function withCompanyScope(path: string, workspaceId?: string) {
  if (!workspaceId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}workspaceId=${encodeURIComponent(workspaceId)}`;
}

function projectPath(id: string, workspaceId?: string, suffix = "") {
  return withCompanyScope(`/projects/${encodeURIComponent(id)}${suffix}`, workspaceId);
}

export const projectsApi = {
  list: (workspaceId: string) => api.get<Project[]>(`/workspaces/${workspaceId}/projects`),
  get: (id: string, workspaceId?: string) => api.get<Project>(projectPath(id, workspaceId)),
  create: (workspaceId: string, data: Record<string, unknown>) =>
    api.post<Project>(`/workspaces/${workspaceId}/projects`, data),
  update: (id: string, data: Record<string, unknown>, workspaceId?: string) =>
    api.patch<Project>(projectPath(id, workspaceId), data),
  listWorkspaces: (projectId: string, workspaceId?: string) =>
    api.get<ProjectWorkspace[]>(projectPath(projectId, workspaceId, "/workspaces")),
  createWorkspace: (projectId: string, data: Record<string, unknown>, workspaceId?: string) =>
    api.post<ProjectWorkspace>(projectPath(projectId, workspaceId, "/workspaces"), data),
  updateWorkspace: (projectId: string, workspaceId: string, data: Record<string, unknown>, workspaceId?: string) =>
    api.patch<ProjectWorkspace>(
      projectPath(projectId, workspaceId, `/workspaces/${encodeURIComponent(workspaceId)}`),
      data,
    ),
  controlWorkspaceRuntimeServices: (
    projectId: string,
    workspaceId: string,
    action: "start" | "stop" | "restart",
    workspaceId?: string,
  ) =>
    api.post<{ workspace: ProjectWorkspace; operation: WorkspaceOperation }>(
      projectPath(projectId, workspaceId, `/workspaces/${encodeURIComponent(workspaceId)}/runtime-services/${action}`),
      {},
    ),
  removeWorkspace: (projectId: string, workspaceId: string, workspaceId?: string) =>
    api.delete<ProjectWorkspace>(projectPath(projectId, workspaceId, `/workspaces/${encodeURIComponent(workspaceId)}`)),
  remove: (id: string, workspaceId?: string) => api.delete<Project>(projectPath(id, workspaceId)),
};
