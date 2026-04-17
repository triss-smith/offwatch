export type WorkspaceSkillSourceType = "local_path" | "github" | "url" | "catalog" | "skills_sh";

export type WorkspaceSkillTrustLevel = "markdown_only" | "assets" | "scripts_executables";

export type WorkspaceSkillCompatibility = "compatible" | "unknown" | "invalid";

export type WorkspaceSkillSourceBadge = "paperclip" | "offwatch" | "github" | "local" | "url" | "catalog" | "skills_sh";

export interface WorkspaceSkillFileInventoryEntry {
  path: string;
  kind: "skill" | "markdown" | "reference" | "script" | "asset" | "other";
}

export interface WorkspaceSkill {
  id: string;
  workspaceId: string;
  key: string;
  slug: string;
  name: string;
  description: string | null;
  markdown: string;
  sourceType: WorkspaceSkillSourceType;
  sourceLocator: string | null;
  sourceRef: string | null;
  trustLevel: WorkspaceSkillTrustLevel;
  compatibility: WorkspaceSkillCompatibility;
  fileInventory: WorkspaceSkillFileInventoryEntry[];
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceSkillListItem {
  id: string;
  workspaceId: string;
  key: string;
  slug: string;
  name: string;
  description: string | null;
  sourceType: WorkspaceSkillSourceType;
  sourceLocator: string | null;
  sourceRef: string | null;
  trustLevel: WorkspaceSkillTrustLevel;
  compatibility: WorkspaceSkillCompatibility;
  fileInventory: WorkspaceSkillFileInventoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  attachedAgentCount: number;
  editable: boolean;
  editableReason: string | null;
  sourceLabel: string | null;
  sourceBadge: WorkspaceSkillSourceBadge;
  sourcePath: string | null;
}

export interface WorkspaceSkillUsageAgent {
  id: string;
  name: string;
  urlKey: string;
  adapterType: string;
  desired: boolean;
  actualState: string | null;
}

export interface WorkspaceSkillDetail extends WorkspaceSkill {
  attachedAgentCount: number;
  usedByAgents: WorkspaceSkillUsageAgent[];
  editable: boolean;
  editableReason: string | null;
  sourceLabel: string | null;
  sourceBadge: WorkspaceSkillSourceBadge;
  sourcePath: string | null;
}

export interface WorkspaceSkillUpdateStatus {
  supported: boolean;
  reason: string | null;
  trackingRef: string | null;
  currentRef: string | null;
  latestRef: string | null;
  hasUpdate: boolean;
}

export interface WorkspaceSkillImportRequest {
  source: string;
}

export interface WorkspaceSkillImportResult {
  imported: WorkspaceSkill[];
  warnings: string[];
}

export interface WorkspaceSkillProjectScanRequest {
  projectIds?: string[];
  workspaceIds?: string[];
}

export interface WorkspaceSkillProjectScanSkipped {
  projectId: string;
  projectName: string;
  workspaceId: string | null;
  workspaceName: string | null;
  path: string | null;
  reason: string;
}

export interface WorkspaceSkillProjectScanConflict {
  slug: string;
  key: string;
  projectId: string;
  projectName: string;
  workspaceId: string;
  workspaceName: string;
  path: string;
  existingSkillId: string;
  existingSkillKey: string;
  existingSourceLocator: string | null;
  reason: string;
}

export interface WorkspaceSkillProjectScanResult {
  scannedProjects: number;
  scannedWorkspaces: number;
  discovered: number;
  imported: WorkspaceSkill[];
  updated: WorkspaceSkill[];
  skipped: WorkspaceSkillProjectScanSkipped[];
  conflicts: WorkspaceSkillProjectScanConflict[];
  warnings: string[];
}

export interface WorkspaceSkillCreateRequest {
  name: string;
  slug?: string | null;
  description?: string | null;
  markdown?: string | null;
}

export interface WorkspaceSkillFileDetail {
  skillId: string;
  path: string;
  kind: WorkspaceSkillFileInventoryEntry["kind"];
  content: string;
  language: string | null;
  markdown: boolean;
  editable: boolean;
}

export interface WorkspaceSkillFileUpdateRequest {
  path: string;
  content: string;
}
