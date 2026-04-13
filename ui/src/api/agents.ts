import type {
  Agent,
  AgentDetail,
  AgentInstructionsBundle,
  AgentInstructionsFileDetail,
  AgentSkillSnapshot,
  AdapterEnvironmentTestResult,
  AgentKeyCreated,
  AgentRuntimeState,
  AgentTaskSession,
  AgentWakeupResponse,
  HeartbeatRun,
  Approval,
  AgentConfigRevision,
} from "@paperclipai/shared";
import { isUuidLike, normalizeAgentUrlKey } from "@paperclipai/shared";
import { ApiError, api } from "./client";

export interface AgentKey {
  id: string;
  name: string;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface AdapterModel {
  id: string;
  label: string;
}

export interface DetectedAdapterModel {
  model: string;
  provider: string;
  source: string;
  candidates?: string[];
}

export interface ClaudeLoginResult {
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  loginUrl: string | null;
  stdout: string;
  stderr: string;
}

export interface OrgNode {
  id: string;
  name: string;
  role: string;
  status: string;
  reports: OrgNode[];
}

export interface AgentHireResponse {
  agent: Agent;
  approval: Approval | null;
}

export interface AgentPermissionUpdate {
  canCreateAgents: boolean;
  canAssignTasks: boolean;
}

function withCompanyScope(path: string, workspaceId?: string) {
  if (!workspaceId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}workspaceId=${encodeURIComponent(workspaceId)}`;
}

function agentPath(id: string, workspaceId?: string, suffix = "") {
  return withCompanyScope(`/agents/${encodeURIComponent(id)}${suffix}`, workspaceId);
}

export const agentsApi = {
  list: (workspaceId: string) => api.get<Agent[]>(`/workspaces/${workspaceId}/agents`),
  org: (workspaceId: string) => api.get<OrgNode[]>(`/workspaces/${workspaceId}/org`),
  listConfigurations: (workspaceId: string) =>
    api.get<Record<string, unknown>[]>(`/workspaces/${workspaceId}/agent-configurations`),
  get: async (id: string, workspaceId?: string) => {
    try {
      return await api.get<AgentDetail>(agentPath(id, workspaceId));
    } catch (error) {
      // Backward-compat fallback: if backend shortname lookup reports ambiguity,
      // resolve using company agent list while ignoring terminated agents.
      if (
        !(error instanceof ApiError) ||
        error.status !== 409 ||
        !workspaceId ||
        isUuidLike(id)
      ) {
        throw error;
      }

      const urlKey = normalizeAgentUrlKey(id);
      if (!urlKey) throw error;

      const agents = await api.get<Agent[]>(`/workspaces/${workspaceId}/agents`);
      const matches = agents.filter(
        (agent) => agent.status !== "terminated" && normalizeAgentUrlKey(agent.urlKey) === urlKey,
      );
      if (matches.length !== 1) throw error;
      return api.get<AgentDetail>(agentPath(matches[0]!.id, workspaceId));
    }
  },
  getConfiguration: (id: string, workspaceId?: string) =>
    api.get<Record<string, unknown>>(agentPath(id, workspaceId, "/configuration")),
  listConfigRevisions: (id: string, workspaceId?: string) =>
    api.get<AgentConfigRevision[]>(agentPath(id, workspaceId, "/config-revisions")),
  getConfigRevision: (id: string, revisionId: string, workspaceId?: string) =>
    api.get<AgentConfigRevision>(agentPath(id, workspaceId, `/config-revisions/${revisionId}`)),
  rollbackConfigRevision: (id: string, revisionId: string, workspaceId?: string) =>
    api.post<Agent>(agentPath(id, workspaceId, `/config-revisions/${revisionId}/rollback`), {}),
  create: (workspaceId: string, data: Record<string, unknown>) =>
    api.post<Agent>(`/workspaces/${workspaceId}/agents`, data),
  hire: (workspaceId: string, data: Record<string, unknown>) =>
    api.post<AgentHireResponse>(`/workspaces/${workspaceId}/agent-hires`, data),
  update: (id: string, data: Record<string, unknown>, workspaceId?: string) =>
    api.patch<Agent>(agentPath(id, workspaceId), data),
  updatePermissions: (id: string, data: AgentPermissionUpdate, workspaceId?: string) =>
    api.patch<AgentDetail>(agentPath(id, workspaceId, "/permissions"), data),
  instructionsBundle: (id: string, workspaceId?: string) =>
    api.get<AgentInstructionsBundle>(agentPath(id, workspaceId, "/instructions-bundle")),
  updateInstructionsBundle: (
    id: string,
    data: {
      mode?: "managed" | "external";
      rootPath?: string | null;
      entryFile?: string;
      clearLegacyPromptTemplate?: boolean;
    },
    workspaceId?: string,
  ) => api.patch<AgentInstructionsBundle>(agentPath(id, workspaceId, "/instructions-bundle"), data),
  instructionsFile: (id: string, relativePath: string, workspaceId?: string) =>
    api.get<AgentInstructionsFileDetail>(
      agentPath(id, workspaceId, `/instructions-bundle/file?path=${encodeURIComponent(relativePath)}`),
    ),
  saveInstructionsFile: (
    id: string,
    data: { path: string; content: string; clearLegacyPromptTemplate?: boolean },
    workspaceId?: string,
  ) => api.put<AgentInstructionsFileDetail>(agentPath(id, workspaceId, "/instructions-bundle/file"), data),
  deleteInstructionsFile: (id: string, relativePath: string, workspaceId?: string) =>
    api.delete<AgentInstructionsBundle>(
      agentPath(id, workspaceId, `/instructions-bundle/file?path=${encodeURIComponent(relativePath)}`),
    ),
  pause: (id: string, workspaceId?: string) => api.post<Agent>(agentPath(id, workspaceId, "/pause"), {}),
  resume: (id: string, workspaceId?: string) => api.post<Agent>(agentPath(id, workspaceId, "/resume"), {}),
  terminate: (id: string, workspaceId?: string) => api.post<Agent>(agentPath(id, workspaceId, "/terminate"), {}),
  remove: (id: string, workspaceId?: string) => api.delete<{ ok: true }>(agentPath(id, workspaceId)),
  listKeys: (id: string, workspaceId?: string) => api.get<AgentKey[]>(agentPath(id, workspaceId, "/keys")),
  skills: (id: string, workspaceId?: string) =>
    api.get<AgentSkillSnapshot>(agentPath(id, workspaceId, "/skills")),
  syncSkills: (id: string, desiredSkills: string[], workspaceId?: string) =>
    api.post<AgentSkillSnapshot>(agentPath(id, workspaceId, "/skills/sync"), { desiredSkills }),
  createKey: (id: string, name: string, workspaceId?: string) =>
    api.post<AgentKeyCreated>(agentPath(id, workspaceId, "/keys"), { name }),
  revokeKey: (agentId: string, keyId: string, workspaceId?: string) =>
    api.delete<{ ok: true }>(agentPath(agentId, workspaceId, `/keys/${encodeURIComponent(keyId)}`)),
  runtimeState: (id: string, workspaceId?: string) =>
    api.get<AgentRuntimeState>(agentPath(id, workspaceId, "/runtime-state")),
  taskSessions: (id: string, workspaceId?: string) =>
    api.get<AgentTaskSession[]>(agentPath(id, workspaceId, "/task-sessions")),
  resetSession: (id: string, taskKey?: string | null, workspaceId?: string) =>
    api.post<void>(agentPath(id, workspaceId, "/runtime-state/reset-session"), { taskKey: taskKey ?? null }),
  adapterModels: (workspaceId: string, type: string) =>
    api.get<AdapterModel[]>(
      `/workspaces/${encodeURIComponent(workspaceId)}/adapters/${encodeURIComponent(type)}/models`,
    ),
  detectModel: (workspaceId: string, type: string) =>
    api.get<DetectedAdapterModel | null>(
      `/workspaces/${encodeURIComponent(workspaceId)}/adapters/${encodeURIComponent(type)}/detect-model`,
    ),
  testEnvironment: (
    workspaceId: string,
    type: string,
    data: { adapterConfig: Record<string, unknown> },
  ) =>
    api.post<AdapterEnvironmentTestResult>(
      `/workspaces/${workspaceId}/adapters/${type}/test-environment`,
      data,
    ),
  invoke: (id: string, workspaceId?: string) => api.post<HeartbeatRun>(agentPath(id, workspaceId, "/heartbeat/invoke"), {}),
  wakeup: (
    id: string,
    data: {
      source?: "timer" | "assignment" | "on_demand" | "automation";
      triggerDetail?: "manual" | "ping" | "callback" | "system";
      reason?: string | null;
      payload?: Record<string, unknown> | null;
      idempotencyKey?: string | null;
    },
    workspaceId?: string,
  ) => api.post<AgentWakeupResponse>(agentPath(id, workspaceId, "/wakeup"), data),
  loginWithClaude: (id: string, workspaceId?: string) =>
    api.post<ClaudeLoginResult>(agentPath(id, workspaceId, "/claude-login"), {}),
  availableSkills: () =>
    api.get<{ skills: AvailableSkill[] }>("/skills/available"),
};

export interface AvailableSkill {
  name: string;
  description: string;
  isPaperclipManaged: boolean;
}
