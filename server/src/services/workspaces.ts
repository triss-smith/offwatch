import { and, count, eq, inArray } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import {
  workspaces,
  companyLogos,
  assets,
  agents,
  agentApiKeys,
  agentRuntimeState,
  agentTaskSessions,
  agentWakeupRequests,
  issues,
  issueComments,
  projects,
  goals,
  heartbeatRuns,
  heartbeatRunEvents,
  costEvents,
  financeEvents,
  issueReadStates,
  approvalComments,
  approvals,
  activityLog,
  companySecrets,
  joinRequests,
  invites,
  principalPermissionGrants,
  companyMemberships,
  workspaceSkills,
} from "@paperclipai/db";
import { notFound, unprocessable } from "../errors.js";

export function workspaceService(db: Db) {
  const ISSUE_PREFIX_FALLBACK = "CMP";

  const workspaceSelection = {
    id: workspaces.id,
    name: workspaces.name,
    status: workspaces.status,
    issuePrefix: workspaces.issuePrefix,
    issueCounter: workspaces.issueCounter,
    requireBoardApprovalForNewAgents: workspaces.requireBoardApprovalForNewAgents,
    brandColor: workspaces.brandColor,
    logoAssetId: companyLogos.assetId,
    issueTrackerConfig: workspaces.issueTrackerConfig,
    repoPath: workspaces.repoPath,
    worktreesPath: workspaces.worktreesPath,
    createdAt: workspaces.createdAt,
    updatedAt: workspaces.updatedAt,
  };

  function enrichWorkspace<T extends { logoAssetId: string | null }>(workspace: T) {
    return {
      ...workspace,
      logoUrl: workspace.logoAssetId ? `/api/assets/${workspace.logoAssetId}/content` : null,
    };
  }

  function getWorkspaceQuery(database: Pick<Db, "select">) {
    return database
      .select(workspaceSelection)
      .from(workspaces)
      .leftJoin(companyLogos, eq(companyLogos.workspaceId, workspaces.id));
  }

  function deriveIssuePrefixBase(name: string) {
    const normalized = name.toUpperCase().replace(/[^A-Z]/g, "");
    return normalized.slice(0, 3) || ISSUE_PREFIX_FALLBACK;
  }

  function suffixForAttempt(attempt: number) {
    if (attempt <= 1) return "";
    return "A".repeat(attempt - 1);
  }

  function isIssuePrefixConflict(error: unknown) {
    const constraint = typeof error === "object" && error !== null && "constraint" in error
      ? (error as { constraint?: string }).constraint
      : typeof error === "object" && error !== null && "constraint_name" in error
        ? (error as { constraint_name?: string }).constraint_name
        : undefined;
    return typeof error === "object"
      && error !== null
      && "code" in error
      && (error as { code?: string }).code === "23505"
      && constraint === "companies_issue_prefix_idx";
  }

  async function createWorkspaceWithUniquePrefix(data: typeof workspaces.$inferInsert) {
    const base = deriveIssuePrefixBase(data.name);
    let suffix = 1;
    while (suffix < 10000) {
      const candidate = `${base}${suffixForAttempt(suffix)}`;
      try {
        const rows = await db
          .insert(workspaces)
          .values({ ...data, issuePrefix: candidate })
          .returning();
        return rows[0];
      } catch (error) {
        if (!isIssuePrefixConflict(error)) throw error;
      }
      suffix += 1;
    }
    throw new Error("Unable to allocate unique issue prefix");
  }

  return {
    list: async () => {
      const rows = await getWorkspaceQuery(db);
      return rows.map((row) => enrichWorkspace(row));
    },

    getById: async (id: string) => {
      const row = await getWorkspaceQuery(db)
        .where(eq(workspaces.id, id))
        .then((rows) => rows[0] ?? null);
      if (!row) return null;
      return enrichWorkspace(row);
    },

    create: async (data: typeof workspaces.$inferInsert) => {
      const created = await createWorkspaceWithUniquePrefix(data);
      const row = await getWorkspaceQuery(db)
        .where(eq(workspaces.id, created.id))
        .then((rows) => rows[0] ?? null);
      if (!row) throw notFound("Workspace not found after creation");
      return enrichWorkspace(row);
    },

    update: (
      id: string,
      data: Partial<typeof workspaces.$inferInsert> & { logoAssetId?: string | null },
    ) =>
      db.transaction(async (tx) => {
        const existing = await getWorkspaceQuery(tx)
          .where(eq(workspaces.id, id))
          .then((rows) => rows[0] ?? null);
        if (!existing) return null;

        const { logoAssetId, ...workspacePatch } = data;

        if (logoAssetId !== undefined && logoAssetId !== null) {
          const nextLogoAsset = await tx
            .select({ id: assets.id, workspaceId: assets.workspaceId })
            .from(assets)
            .where(eq(assets.id, logoAssetId))
            .then((rows) => rows[0] ?? null);
          if (!nextLogoAsset) throw notFound("Logo asset not found");
          if (nextLogoAsset.workspaceId !== existing.id) {
            throw unprocessable("Logo asset must belong to the same workspace");
          }
        }

        const updated = await tx
          .update(workspaces)
          .set({ ...workspacePatch, updatedAt: new Date() })
          .where(eq(workspaces.id, id))
          .returning()
          .then((rows) => rows[0] ?? null);
        if (!updated) return null;

        if (logoAssetId === null) {
          await tx.delete(companyLogos).where(eq(companyLogos.workspaceId, id));
        } else if (logoAssetId !== undefined) {
          await tx
            .insert(companyLogos)
            .values({
              workspaceId: id,
              assetId: logoAssetId,
            })
            .onConflictDoUpdate({
              target: companyLogos.workspaceId,
              set: {
                assetId: logoAssetId,
                updatedAt: new Date(),
              },
            });
        }

        if (logoAssetId !== undefined && existing.logoAssetId && existing.logoAssetId !== logoAssetId) {
          await tx.delete(assets).where(eq(assets.id, existing.logoAssetId));
        }

        return enrichWorkspace({
          ...updated,
          logoAssetId: logoAssetId === undefined ? existing.logoAssetId : logoAssetId,
        });
      }),

    archive: (id: string) =>
      db.transaction(async (tx) => {
        const updated = await tx
          .update(workspaces)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(workspaces.id, id))
          .returning()
          .then((rows) => rows[0] ?? null);
        if (!updated) return null;
        const row = await getWorkspaceQuery(tx)
          .where(eq(workspaces.id, id))
          .then((rows) => rows[0] ?? null);
        if (!row) return null;
        return enrichWorkspace(row);
      }),

    remove: (id: string) =>
      db.transaction(async (tx) => {
        // Delete from child tables in dependency order
        await tx.delete(heartbeatRunEvents).where(eq(heartbeatRunEvents.workspaceId, id));
        await tx.delete(agentTaskSessions).where(eq(agentTaskSessions.workspaceId, id));
        await tx.delete(activityLog).where(eq(activityLog.workspaceId, id));
        await tx.delete(heartbeatRuns).where(eq(heartbeatRuns.workspaceId, id));
        await tx.delete(agentWakeupRequests).where(eq(agentWakeupRequests.workspaceId, id));
        await tx.delete(agentApiKeys).where(eq(agentApiKeys.workspaceId, id));
        await tx.delete(agentRuntimeState).where(eq(agentRuntimeState.workspaceId, id));
        await tx.delete(issueComments).where(eq(issueComments.workspaceId, id));
        await tx.delete(costEvents).where(eq(costEvents.workspaceId, id));
        await tx.delete(financeEvents).where(eq(financeEvents.workspaceId, id));
        await tx.delete(approvalComments).where(eq(approvalComments.workspaceId, id));
        await tx.delete(approvals).where(eq(approvals.workspaceId, id));
        await tx.delete(companySecrets).where(eq(companySecrets.workspaceId, id));
        await tx.delete(joinRequests).where(eq(joinRequests.workspaceId, id));
        await tx.delete(invites).where(eq(invites.workspaceId, id));
        await tx.delete(principalPermissionGrants).where(eq(principalPermissionGrants.workspaceId, id));
        await tx.delete(companyMemberships).where(eq(companyMemberships.workspaceId, id));
        await tx.delete(workspaceSkills).where(eq(workspaceSkills.workspaceId, id));
        await tx.delete(issueReadStates).where(eq(issueReadStates.workspaceId, id));
        await tx.delete(issues).where(eq(issues.workspaceId, id));
        await tx.delete(companyLogos).where(eq(companyLogos.workspaceId, id));
        await tx.delete(assets).where(eq(assets.workspaceId, id));
        await tx.delete(goals).where(eq(goals.workspaceId, id));
        await tx.delete(projects).where(eq(projects.workspaceId, id));
        await tx.delete(agents).where(eq(agents.workspaceId, id));
        const rows = await tx
          .delete(workspaces)
          .where(eq(workspaces.id, id))
          .returning();
        return rows[0] ?? null;
      }),

    stats: () =>
      Promise.all([
        db
          .select({ workspaceId: agents.workspaceId, count: count() })
          .from(agents)
          .groupBy(agents.workspaceId),
        db
          .select({ workspaceId: issues.workspaceId, count: count() })
          .from(issues)
          .groupBy(issues.workspaceId),
      ]).then(([agentRows, issueRows]) => {
        const result: Record<string, { agentCount: number; issueCount: number }> = {};
        for (const row of agentRows) {
          result[row.workspaceId] = { agentCount: row.count, issueCount: 0 };
        }
        for (const row of issueRows) {
          if (result[row.workspaceId]) {
            result[row.workspaceId].issueCount = row.count;
          } else {
            result[row.workspaceId] = { agentCount: 0, issueCount: row.count };
          }
        }
        return result;
      }),
  };
}
