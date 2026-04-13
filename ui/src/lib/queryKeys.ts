export const queryKeys = {
  companies: {
    all: ["companies"] as const,
    detail: (id: string) => ["companies", id] as const,
    stats: ["companies", "stats"] as const,
  },
  companySkills: {
    list: (workspaceId: string) => ["company-skills", workspaceId] as const,
    detail: (workspaceId: string, skillId: string) => ["company-skills", workspaceId, skillId] as const,
    updateStatus: (workspaceId: string, skillId: string) =>
      ["company-skills", workspaceId, skillId, "update-status"] as const,
    file: (workspaceId: string, skillId: string, relativePath: string) =>
      ["company-skills", workspaceId, skillId, "file", relativePath] as const,
  },
  agents: {
    list: (workspaceId: string) => ["agents", workspaceId] as const,
    detail: (id: string) => ["agents", "detail", id] as const,
    runtimeState: (id: string) => ["agents", "runtime-state", id] as const,
    taskSessions: (id: string) => ["agents", "task-sessions", id] as const,
    skills: (id: string) => ["agents", "skills", id] as const,
    instructionsBundle: (id: string) => ["agents", "instructions-bundle", id] as const,
    instructionsFile: (id: string, relativePath: string) =>
      ["agents", "instructions-bundle", id, "file", relativePath] as const,
    keys: (agentId: string) => ["agents", "keys", agentId] as const,
    configRevisions: (agentId: string) => ["agents", "config-revisions", agentId] as const,
    adapterModels: (workspaceId: string, adapterType: string) =>
      ["agents", workspaceId, "adapter-models", adapterType] as const,
    detectModel: (workspaceId: string, adapterType: string) =>
      ["agents", workspaceId, "detect-model", adapterType] as const,
  },
  issues: {
    list: (workspaceId: string) => ["issues", workspaceId] as const,
    search: (workspaceId: string, q: string, projectId?: string, limit?: number) =>
      ["issues", workspaceId, "search", q, projectId ?? "__all-projects__", limit ?? "__no-limit__"] as const,
    listAssignedToMe: (workspaceId: string) => ["issues", workspaceId, "assigned-to-me"] as const,
    listMineByMe: (workspaceId: string) => ["issues", workspaceId, "mine-by-me"] as const,
    listTouchedByMe: (workspaceId: string) => ["issues", workspaceId, "touched-by-me"] as const,
    listUnreadTouchedByMe: (workspaceId: string) => ["issues", workspaceId, "unread-touched-by-me"] as const,
    labels: (workspaceId: string) => ["issues", workspaceId, "labels"] as const,
    listByProject: (workspaceId: string, projectId: string) =>
      ["issues", workspaceId, "project", projectId] as const,
    listByParent: (workspaceId: string, parentId: string) =>
      ["issues", workspaceId, "parent", parentId] as const,
    listByExecutionWorkspace: (workspaceId: string, executionWorkspaceId: string) =>
      ["issues", workspaceId, "execution-workspace", executionWorkspaceId] as const,
    detail: (id: string) => ["issues", "detail", id] as const,
    comments: (issueId: string) => ["issues", "comments", issueId] as const,
    feedbackVotes: (issueId: string) => ["issues", "feedback-votes", issueId] as const,
    attachments: (issueId: string) => ["issues", "attachments", issueId] as const,
    documents: (issueId: string) => ["issues", "documents", issueId] as const,
    documentRevisions: (issueId: string, key: string) => ["issues", "document-revisions", issueId, key] as const,
    activity: (issueId: string) => ["issues", "activity", issueId] as const,
    runs: (issueId: string) => ["issues", "runs", issueId] as const,
    approvals: (issueId: string) => ["issues", "approvals", issueId] as const,
    liveRuns: (issueId: string) => ["issues", "live-runs", issueId] as const,
    activeRun: (issueId: string) => ["issues", "active-run", issueId] as const,
    workProducts: (issueId: string) => ["issues", "work-products", issueId] as const,
  },
  routines: {
    list: (workspaceId: string) => ["routines", workspaceId] as const,
    detail: (id: string) => ["routines", "detail", id] as const,
    runs: (id: string) => ["routines", "runs", id] as const,
    activity: (workspaceId: string, id: string) => ["routines", "activity", workspaceId, id] as const,
  },
  executionWorkspaces: {
    list: (workspaceId: string, filters?: Record<string, string | boolean | undefined>) =>
      ["execution-workspaces", workspaceId, filters ?? {}] as const,
    detail: (id: string) => ["execution-workspaces", "detail", id] as const,
    closeReadiness: (id: string) => ["execution-workspaces", "close-readiness", id] as const,
    workspaceOperations: (id: string) => ["execution-workspaces", "workspace-operations", id] as const,
  },
  projects: {
    list: (workspaceId: string) => ["projects", workspaceId] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
  },
  goals: {
    list: (workspaceId: string) => ["goals", workspaceId] as const,
    detail: (id: string) => ["goals", "detail", id] as const,
  },
  budgets: {
    overview: (workspaceId: string) => ["budgets", "overview", workspaceId] as const,
  },
  approvals: {
    list: (workspaceId: string, status?: string) =>
      ["approvals", workspaceId, status] as const,
    detail: (approvalId: string) => ["approvals", "detail", approvalId] as const,
    comments: (approvalId: string) => ["approvals", "comments", approvalId] as const,
    issues: (approvalId: string) => ["approvals", "issues", approvalId] as const,
  },
  access: {
    joinRequests: (workspaceId: string, status: string = "pending_approval") =>
      ["access", "join-requests", workspaceId, status] as const,
    invite: (token: string) => ["access", "invite", token] as const,
  },
  auth: {
    session: ["auth", "session"] as const,
  },
  instance: {
    generalSettings: ["instance", "general-settings"] as const,
    schedulerHeartbeats: ["instance", "scheduler-heartbeats"] as const,
    experimentalSettings: ["instance", "experimental-settings"] as const,
  },
  health: ["health"] as const,
  secrets: {
    list: (workspaceId: string) => ["secrets", workspaceId] as const,
    providers: (workspaceId: string) => ["secret-providers", workspaceId] as const,
  },
  dashboard: (workspaceId: string) => ["dashboard", workspaceId] as const,
  sidebarBadges: (workspaceId: string) => ["sidebar-badges", workspaceId] as const,
  inboxDismissals: (workspaceId: string) => ["inbox-dismissals", workspaceId] as const,
  activity: (workspaceId: string) => ["activity", workspaceId] as const,
  costs: (workspaceId: string, from?: string, to?: string) =>
    ["costs", workspaceId, from, to] as const,
  usageByProvider: (workspaceId: string, from?: string, to?: string) =>
    ["usage-by-provider", workspaceId, from, to] as const,
  usageByBiller: (workspaceId: string, from?: string, to?: string) =>
    ["usage-by-biller", workspaceId, from, to] as const,
  financeSummary: (workspaceId: string, from?: string, to?: string) =>
    ["finance-summary", workspaceId, from, to] as const,
  financeByBiller: (workspaceId: string, from?: string, to?: string) =>
    ["finance-by-biller", workspaceId, from, to] as const,
  financeByKind: (workspaceId: string, from?: string, to?: string) =>
    ["finance-by-kind", workspaceId, from, to] as const,
  financeEvents: (workspaceId: string, from?: string, to?: string, limit: number = 100) =>
    ["finance-events", workspaceId, from, to, limit] as const,
  usageWindowSpend: (workspaceId: string) =>
    ["usage-window-spend", workspaceId] as const,
  usageQuotaWindows: (workspaceId: string) =>
    ["usage-quota-windows", workspaceId] as const,
  heartbeats: (workspaceId: string, agentId?: string) =>
    ["heartbeats", workspaceId, agentId] as const,
  runDetail: (runId: string) => ["heartbeat-run", runId] as const,
  runWorkspaceOperations: (runId: string) => ["heartbeat-run", runId, "workspace-operations"] as const,
  liveRuns: (workspaceId: string) => ["live-runs", workspaceId] as const,
  runIssues: (runId: string) => ["run-issues", runId] as const,
  org: (workspaceId: string) => ["org", workspaceId] as const,
  skills: {
    available: ["skills", "available"] as const,
  },
  plugins: {
    all: ["plugins"] as const,
    examples: ["plugins", "examples"] as const,
    detail: (pluginId: string) => ["plugins", pluginId] as const,
    health: (pluginId: string) => ["plugins", pluginId, "health"] as const,
    uiContributions: ["plugins", "ui-contributions"] as const,
    config: (pluginId: string) => ["plugins", pluginId, "config"] as const,
    dashboard: (pluginId: string) => ["plugins", pluginId, "dashboard"] as const,
    logs: (pluginId: string) => ["plugins", pluginId, "logs"] as const,
  },
  adapters: {
    all: ["adapters"] as const,
  },
};
