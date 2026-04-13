import type { AgentEnvConfig } from "./secrets.js";
import type { RoutineVariable } from "./routine.js";

export interface WorkspacePortabilityInclude {
  company: boolean;
  agents: boolean;
  projects: boolean;
  issues: boolean;
  skills: boolean;
}

export interface WorkspacePortabilityEnvInput {
  key: string;
  description: string | null;
  agentSlug: string | null;
  projectSlug: string | null;
  kind: "secret" | "plain";
  requirement: "required" | "optional";
  defaultValue: string | null;
  portability: "portable" | "system_dependent";
}

export type WorkspacePortabilityFileEntry =
  | string
  | {
      encoding: "base64";
      data: string;
      contentType?: string | null;
    };

export interface WorkspacePortabilityCompanyManifestEntry {
  path: string;
  name: string;
  description: string | null;
  brandColor: string | null;
  logoPath: string | null;
  requireBoardApprovalForNewAgents: boolean;
  feedbackDataSharingEnabled: boolean;
  feedbackDataSharingConsentAt: string | null;
  feedbackDataSharingConsentByUserId: string | null;
  feedbackDataSharingTermsVersion: string | null;
}

export interface WorkspacePortabilitySidebarOrder {
  agents: string[];
  projects: string[];
}

export interface WorkspacePortabilityProjectManifestEntry {
  slug: string;
  name: string;
  path: string;
  description: string | null;
  ownerAgentSlug: string | null;
  leadAgentSlug: string | null;
  targetDate: string | null;
  color: string | null;
  status: string | null;
  env: AgentEnvConfig | null;
  executionWorkspacePolicy: Record<string, unknown> | null;
  workspaces: WorkspacePortabilityProjectWorkspaceManifestEntry[];
  metadata: Record<string, unknown> | null;
}

export interface WorkspacePortabilityProjectWorkspaceManifestEntry {
  key: string;
  name: string;
  sourceType: string | null;
  repoUrl: string | null;
  repoRef: string | null;
  defaultRef: string | null;
  visibility: string | null;
  setupCommand: string | null;
  cleanupCommand: string | null;
  metadata: Record<string, unknown> | null;
  isPrimary: boolean;
}

export interface WorkspacePortabilityIssueRoutineTriggerManifestEntry {
  kind: string;
  label: string | null;
  enabled: boolean;
  cronExpression: string | null;
  timezone: string | null;
  signingMode: string | null;
  replayWindowSec: number | null;
}

export interface WorkspacePortabilityIssueRoutineManifestEntry {
  concurrencyPolicy: string | null;
  catchUpPolicy: string | null;
  variables?: RoutineVariable[] | null;
  triggers: WorkspacePortabilityIssueRoutineTriggerManifestEntry[];
}

export interface WorkspacePortabilityIssueManifestEntry {
  slug: string;
  identifier: string | null;
  title: string;
  path: string;
  projectSlug: string | null;
  projectWorkspaceKey: string | null;
  assigneeAgentSlug: string | null;
  description: string | null;
  recurring: boolean;
  routine: WorkspacePortabilityIssueRoutineManifestEntry | null;
  legacyRecurrence: Record<string, unknown> | null;
  status: string | null;
  priority: string | null;
  labelIds: string[];
  billingCode: string | null;
  executionWorkspaceSettings: Record<string, unknown> | null;
  assigneeAdapterOverrides: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

export interface WorkspacePortabilityAgentManifestEntry {
  slug: string;
  name: string;
  path: string;
  skills: string[];
  role: string;
  title: string | null;
  icon: string | null;
  capabilities: string | null;
  reportsToSlug: string | null;
  adapterType: string;
  adapterConfig: Record<string, unknown>;
  runtimeConfig: Record<string, unknown>;
  permissions: Record<string, unknown>;
  budgetMonthlyCents: number;
  metadata: Record<string, unknown> | null;
}

export interface WorkspacePortabilitySkillManifestEntry {
  key: string;
  slug: string;
  name: string;
  path: string;
  description: string | null;
  sourceType: string;
  sourceLocator: string | null;
  sourceRef: string | null;
  trustLevel: string | null;
  compatibility: string | null;
  metadata: Record<string, unknown> | null;
  fileInventory: Array<{
    path: string;
    kind: string;
  }>;
}

export interface WorkspacePortabilityManifest {
  schemaVersion: number;
  generatedAt: string;
  source: {
    workspaceId: string;
    workspaceName: string;
  } | null;
  includes: WorkspacePortabilityInclude;
  company: WorkspacePortabilityCompanyManifestEntry | null;
  sidebar: WorkspacePortabilitySidebarOrder | null;
  agents: WorkspacePortabilityAgentManifestEntry[];
  skills: WorkspacePortabilitySkillManifestEntry[];
  projects: WorkspacePortabilityProjectManifestEntry[];
  issues: WorkspacePortabilityIssueManifestEntry[];
  envInputs: WorkspacePortabilityEnvInput[];
}

export interface WorkspacePortabilityExportResult {
  rootPath: string;
  manifest: WorkspacePortabilityManifest;
  files: Record<string, WorkspacePortabilityFileEntry>;
  warnings: string[];
  paperclipExtensionPath: string;
}

export interface WorkspacePortabilityExportPreviewFile {
  path: string;
  kind: "company" | "agent" | "skill" | "project" | "issue" | "extension" | "readme" | "other";
}

export interface WorkspacePortabilityExportPreviewResult {
  rootPath: string;
  manifest: WorkspacePortabilityManifest;
  files: Record<string, WorkspacePortabilityFileEntry>;
  fileInventory: WorkspacePortabilityExportPreviewFile[];
  counts: {
    files: number;
    agents: number;
    skills: number;
    projects: number;
    issues: number;
  };
  warnings: string[];
  paperclipExtensionPath: string;
}

export type WorkspacePortabilitySource =
  | {
      type: "inline";
      rootPath?: string | null;
      files: Record<string, WorkspacePortabilityFileEntry>;
    }
  | {
      type: "github";
      url: string;
    };

export type WorkspacePortabilityImportTarget =
  | {
      mode: "new_workspace";
      newWorkspaceName?: string | null;
    }
  | {
      mode: "existing_workspace";
      workspaceId: string;
    };

export type WorkspacePortabilityAgentSelection = "all" | string[];

export type WorkspacePortabilityCollisionStrategy = "rename" | "skip" | "replace";

export interface WorkspacePortabilityPreviewRequest {
  source: WorkspacePortabilitySource;
  include?: Partial<WorkspacePortabilityInclude>;
  target: WorkspacePortabilityImportTarget;
  agents?: WorkspacePortabilityAgentSelection;
  collisionStrategy?: WorkspacePortabilityCollisionStrategy;
  nameOverrides?: Record<string, string>;
  selectedFiles?: string[];
}

export interface WorkspacePortabilityPreviewAgentPlan {
  slug: string;
  action: "create" | "update" | "skip";
  plannedName: string;
  existingAgentId: string | null;
  reason: string | null;
}

export interface WorkspacePortabilityPreviewProjectPlan {
  slug: string;
  action: "create" | "update" | "skip";
  plannedName: string;
  existingProjectId: string | null;
  reason: string | null;
}

export interface WorkspacePortabilityPreviewIssuePlan {
  slug: string;
  action: "create" | "skip";
  plannedTitle: string;
  reason: string | null;
}

export interface WorkspacePortabilityPreviewResult {
  include: WorkspacePortabilityInclude;
  targetWorkspaceId: string | null;
  targetWorkspaceName: string | null;
  collisionStrategy: WorkspacePortabilityCollisionStrategy;
  selectedAgentSlugs: string[];
  plan: {
    workspaceAction: "none" | "create" | "update";
    agentPlans: WorkspacePortabilityPreviewAgentPlan[];
    projectPlans: WorkspacePortabilityPreviewProjectPlan[];
    issuePlans: WorkspacePortabilityPreviewIssuePlan[];
  };
  manifest: WorkspacePortabilityManifest;
  files: Record<string, WorkspacePortabilityFileEntry>;
  envInputs: WorkspacePortabilityEnvInput[];
  warnings: string[];
  errors: string[];
}

export interface WorkspacePortabilityAdapterOverride {
  adapterType: string;
  adapterConfig?: Record<string, unknown>;
}

export interface WorkspacePortabilityImportRequest extends WorkspacePortabilityPreviewRequest {
  adapterOverrides?: Record<string, WorkspacePortabilityAdapterOverride>;
}

export interface WorkspacePortabilityImportResult {
  workspace: {
    id: string;
    name: string;
    action: "created" | "updated" | "unchanged";
  };
  agents: {
    slug: string;
    id: string | null;
    action: "created" | "updated" | "skipped";
    name: string;
    reason: string | null;
  }[];
  projects: {
    slug: string;
    id: string | null;
    action: "created" | "updated" | "skipped";
    name: string;
    reason: string | null;
  }[];
  envInputs: WorkspacePortabilityEnvInput[];
  warnings: string[];
}

export interface WorkspacePortabilityExportRequest {
  include?: Partial<WorkspacePortabilityInclude>;
  agents?: string[];
  skills?: string[];
  projects?: string[];
  issues?: string[];
  projectIssues?: string[];
  selectedFiles?: string[];
  expandReferencedSkills?: boolean;
  sidebarOrder?: Partial<WorkspacePortabilitySidebarOrder>;
}
