import { z } from "zod";

export const workspaceSkillSourceTypeSchema = z.enum(["local_path", "github", "url", "catalog", "skills_sh"]);
export const workspaceSkillTrustLevelSchema = z.enum(["markdown_only", "assets", "scripts_executables"]);
export const workspaceSkillCompatibilitySchema = z.enum(["compatible", "unknown", "invalid"]);
export const workspaceSkillSourceBadgeSchema = z.enum(["paperclip", "github", "local", "url", "catalog", "skills_sh"]);

export const workspaceSkillFileInventoryEntrySchema = z.object({
  path: z.string().min(1),
  kind: z.enum(["skill", "markdown", "reference", "script", "asset", "other"]),
});

export const workspaceSkillSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  key: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  markdown: z.string(),
  sourceType: workspaceSkillSourceTypeSchema,
  sourceLocator: z.string().nullable(),
  sourceRef: z.string().nullable(),
  trustLevel: workspaceSkillTrustLevelSchema,
  compatibility: workspaceSkillCompatibilitySchema,
  fileInventory: z.array(workspaceSkillFileInventoryEntrySchema).default([]),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const workspaceSkillListItemSchema = workspaceSkillSchema.extend({
  attachedAgentCount: z.number().int().nonnegative(),
  editable: z.boolean(),
  editableReason: z.string().nullable(),
  sourceLabel: z.string().nullable(),
  sourceBadge: workspaceSkillSourceBadgeSchema,
});

export const workspaceSkillUsageAgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  urlKey: z.string().min(1),
  adapterType: z.string().min(1),
  desired: z.boolean(),
  actualState: z.string().nullable(),
});

export const workspaceSkillDetailSchema = workspaceSkillSchema.extend({
  attachedAgentCount: z.number().int().nonnegative(),
  usedByAgents: z.array(workspaceSkillUsageAgentSchema).default([]),
  editable: z.boolean(),
  editableReason: z.string().nullable(),
  sourceLabel: z.string().nullable(),
  sourceBadge: workspaceSkillSourceBadgeSchema,
});

export const workspaceSkillUpdateStatusSchema = z.object({
  supported: z.boolean(),
  reason: z.string().nullable(),
  trackingRef: z.string().nullable(),
  currentRef: z.string().nullable(),
  latestRef: z.string().nullable(),
  hasUpdate: z.boolean(),
});

export const workspaceSkillImportSchema = z.object({
  source: z.string().min(1),
});

export const workspaceSkillProjectScanRequestSchema = z.object({
  projectIds: z.array(z.string().uuid()).optional(),
  workspaceIds: z.array(z.string().uuid()).optional(),
});

export const workspaceSkillProjectScanSkippedSchema = z.object({
  projectId: z.string().uuid(),
  projectName: z.string().min(1),
  workspaceId: z.string().uuid().nullable(),
  workspaceName: z.string().nullable(),
  path: z.string().nullable(),
  reason: z.string().min(1),
});

export const workspaceSkillProjectScanConflictSchema = z.object({
  slug: z.string().min(1),
  key: z.string().min(1),
  projectId: z.string().uuid(),
  projectName: z.string().min(1),
  workspaceId: z.string().uuid(),
  workspaceName: z.string().min(1),
  path: z.string().min(1),
  existingSkillId: z.string().uuid(),
  existingSkillKey: z.string().min(1),
  existingSourceLocator: z.string().nullable(),
  reason: z.string().min(1),
});

export const workspaceSkillProjectScanResultSchema = z.object({
  scannedProjects: z.number().int().nonnegative(),
  scannedWorkspaces: z.number().int().nonnegative(),
  discovered: z.number().int().nonnegative(),
  imported: z.array(workspaceSkillSchema),
  updated: z.array(workspaceSkillSchema),
  skipped: z.array(workspaceSkillProjectScanSkippedSchema),
  conflicts: z.array(workspaceSkillProjectScanConflictSchema),
  warnings: z.array(z.string()),
});

export const workspaceSkillCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).nullable().optional(),
  description: z.string().nullable().optional(),
  markdown: z.string().nullable().optional(),
});

export const workspaceSkillFileDetailSchema = z.object({
  skillId: z.string().uuid(),
  path: z.string().min(1),
  kind: z.enum(["skill", "markdown", "reference", "script", "asset", "other"]),
  content: z.string(),
  language: z.string().nullable(),
  markdown: z.boolean(),
  editable: z.boolean(),
});

export const workspaceSkillFileUpdateSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

export type WorkspaceSkillImport = z.infer<typeof workspaceSkillImportSchema>;
export type WorkspaceSkillProjectScan = z.infer<typeof workspaceSkillProjectScanRequestSchema>;
export type WorkspaceSkillCreate = z.infer<typeof workspaceSkillCreateSchema>;
export type WorkspaceSkillFileUpdate = z.infer<typeof workspaceSkillFileUpdateSchema>;
