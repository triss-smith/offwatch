import { z } from "zod";

const brandColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional();
const logoAssetIdSchema = z.string().uuid().nullable().optional();

export const createWorkspaceSchema = z.object({
  name: z.string().min(1),
});

export type CreateWorkspace = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = createWorkspaceSchema
  .partial()
  .extend({
    requireBoardApprovalForNewAgents: z.boolean().optional(),
    brandColor: brandColorSchema,
    issueTrackerConfig: z.record(z.unknown()).nullable().optional(),
    repoPath: z.string().nullable().optional(),
    worktreesPath: z.string().nullable().optional(),
  });

export type UpdateWorkspace = z.infer<typeof updateWorkspaceSchema>;

export const updateWorkspaceBrandingSchema = z
  .object({
    name: z.string().min(1).optional(),
    brandColor: brandColorSchema,
    logoAssetId: logoAssetIdSchema,
  })
  .strict()
  .refine(
    (value) => value.name !== undefined || value.brandColor !== undefined || value.logoAssetId !== undefined,
    "At least one branding field must be provided",
  );

export type UpdateWorkspaceBranding = z.infer<typeof updateWorkspaceBrandingSchema>;
