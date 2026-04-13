import { Router, type Request } from "express";
import { and, eq } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { budgetPolicies } from "@paperclipai/db";
import {
  DEFAULT_FEEDBACK_DATA_SHARING_TERMS_VERSION,
  companyPortabilityExportSchema,
  companyPortabilityImportSchema,
  companyPortabilityPreviewSchema,
  createWorkspaceSchema,
  feedbackTargetTypeSchema,
  feedbackTraceStatusSchema,
  feedbackVoteValueSchema,
  updateWorkspaceBrandingSchema,
  updateWorkspaceSchema,
} from "@paperclipai/shared";
import { badRequest, forbidden } from "../errors.js";
import { validate } from "../middleware/validate.js";
import {
  accessService,
  agentService,
  budgetService,
  companyPortabilityService,
  workspaceService,
  feedbackService,
  logActivity,
} from "../services/index.js";
import type { StorageService } from "../storage/types.js";
import { assertBoard, assertCompanyAccess, assertInstanceAdmin, getActorInfo } from "./authz.js";

export function workspaceRoutes(db: Db, storage?: StorageService) {
  const router = Router();
  const svc = workspaceService(db);
  const agents = agentService(db);
  const portability = companyPortabilityService(db, storage);
  const access = accessService(db);
  const budgets = budgetService(db);
  const feedback = feedbackService(db);

  function parseBooleanQuery(value: unknown) {
    return value === true || value === "true" || value === "1";
  }

  function parseDateQuery(value: unknown, field: string) {
    if (typeof value !== "string" || value.trim().length === 0) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw badRequest(`Invalid ${field} query value`);
    }
    return parsed;
  }

  function assertImportTargetAccess(
    req: Request,
    target: { mode: "new_company" } | { mode: "existing_company"; workspaceId: string },
  ) {
    if (target.mode === "new_company") {
      assertInstanceAdmin(req);
      return;
    }
    assertCompanyAccess(req, target.workspaceId);
  }

  async function assertCanUpdateBranding(req: Request, workspaceId: string) {
    assertCompanyAccess(req, workspaceId);
    if (req.actor.type === "board") return;
    if (!req.actor.agentId) throw forbidden("Agent authentication required");

    const actorAgent = await agents.getById(req.actor.agentId);
    if (!actorAgent || actorAgent.workspaceId !== workspaceId) {
      throw forbidden("Agent key cannot access another company");
    }
    if (actorAgent.role !== "ceo") {
      throw forbidden("Only CEO agents can update company branding");
    }
  }

  async function assertCanManagePortability(req: Request, workspaceId: string, capability: "imports" | "exports") {
    assertCompanyAccess(req, workspaceId);
    if (req.actor.type === "board") return;
    if (!req.actor.agentId) throw forbidden("Agent authentication required");

    const actorAgent = await agents.getById(req.actor.agentId);
    if (!actorAgent || actorAgent.workspaceId !== workspaceId) {
      throw forbidden("Agent key cannot access another company");
    }
    if (actorAgent.role !== "ceo") {
      throw forbidden(`Only CEO agents can manage company ${capability}`);
    }
  }

  router.get("/", async (req, res) => {
    assertBoard(req);
    const result = await svc.list();
    if (req.actor.source === "local_implicit" || req.actor.isInstanceAdmin) {
      res.json(result);
      return;
    }
    const allowed = new Set(req.actor.workspaceIds ?? []);
    res.json(result.filter((company) => allowed.has(company.id)));
  });

  router.get("/stats", async (req, res) => {
    assertBoard(req);
    const allowed = req.actor.source === "local_implicit" || req.actor.isInstanceAdmin
      ? null
      : new Set(req.actor.workspaceIds ?? []);
    const stats = await svc.stats();
    if (!allowed) {
      res.json(stats);
      return;
    }
    const filtered = Object.fromEntries(Object.entries(stats).filter(([workspaceId]) => allowed.has(workspaceId)));
    res.json(filtered);
  });

  // Common malformed path when workspaceId is empty in "/api/workspaces/{workspaceId}/issues".
  router.get("/issues", (_req, res) => {
    res.status(400).json({
      error: "Missing workspaceId in path. Use /api/workspaces/{workspaceId}/issues.",
    });
  });

  router.get("/:workspaceId", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    // Allow agents (CEO) to read their own company; board always allowed
    if (req.actor.type !== "agent") {
      assertBoard(req);
    }
    const company = await svc.getById(workspaceId);
    if (!company) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    res.json(company);
  });

  router.get("/:workspaceId/feedback-traces", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    assertBoard(req);

    const targetTypeRaw = typeof req.query.targetType === "string" ? req.query.targetType : undefined;
    const voteRaw = typeof req.query.vote === "string" ? req.query.vote : undefined;
    const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
    const issueId = typeof req.query.issueId === "string" && req.query.issueId.trim().length > 0 ? req.query.issueId : undefined;
    const projectId = typeof req.query.projectId === "string" && req.query.projectId.trim().length > 0
      ? req.query.projectId
      : undefined;

    const traces = await feedback.listFeedbackTraces({
      workspaceId,
      issueId,
      projectId,
      targetType: targetTypeRaw ? feedbackTargetTypeSchema.parse(targetTypeRaw) : undefined,
      vote: voteRaw ? feedbackVoteValueSchema.parse(voteRaw) : undefined,
      status: statusRaw ? feedbackTraceStatusSchema.parse(statusRaw) : undefined,
      from: parseDateQuery(req.query.from, "from"),
      to: parseDateQuery(req.query.to, "to"),
      sharedOnly: parseBooleanQuery(req.query.sharedOnly),
      includePayload: parseBooleanQuery(req.query.includePayload),
    });
    res.json(traces);
  });

  router.post("/:workspaceId/export", validate(companyPortabilityExportSchema), async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const result = await portability.exportBundle(workspaceId, req.body);
    res.json(result);
  });

  router.post("/import/preview", validate(companyPortabilityPreviewSchema), async (req, res) => {
    assertBoard(req);
    assertImportTargetAccess(req, req.body.target);
    const preview = await portability.previewImport(req.body);
    res.json(preview);
  });

  router.post("/import", validate(companyPortabilityImportSchema), async (req, res) => {
    assertBoard(req);
    assertImportTargetAccess(req, req.body.target);
    const actor = getActorInfo(req);
    const result = await portability.importBundle(req.body, req.actor.type === "board" ? req.actor.userId : null);
    await logActivity(db, {
      workspaceId: result.company.id,
      actorType: actor.actorType,
      actorId: actor.actorId,
      action: "company.imported",
      entityType: "company",
      entityId: result.company.id,
      agentId: actor.agentId,
      runId: actor.runId,
      details: {
        include: req.body.include ?? null,
        agentCount: result.agents.length,
        warningCount: result.warnings.length,
        companyAction: result.company.action,
      },
    });
    res.json(result);
  });

  router.post("/:workspaceId/exports/preview", validate(companyPortabilityExportSchema), async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    await assertCanManagePortability(req, workspaceId, "exports");
    const preview = await portability.previewExport(workspaceId, req.body);
    res.json(preview);
  });

  router.post("/:workspaceId/exports", validate(companyPortabilityExportSchema), async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    await assertCanManagePortability(req, workspaceId, "exports");
    const result = await portability.exportBundle(workspaceId, req.body);
    res.json(result);
  });

  router.post("/:workspaceId/imports/preview", validate(companyPortabilityPreviewSchema), async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    await assertCanManagePortability(req, workspaceId, "imports");
    if (req.body.target.mode === "existing_company" && req.body.target.workspaceId !== workspaceId) {
      throw forbidden("Safe import route can only target the route company");
    }
    if (req.body.collisionStrategy === "replace") {
      throw forbidden("Safe import route does not allow replace collision strategy");
    }
    const preview = await portability.previewImport(req.body, {
      mode: "agent_safe",
      sourceCompanyId: workspaceId,
    });
    res.json(preview);
  });

  router.post("/:workspaceId/imports/apply", validate(companyPortabilityImportSchema), async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    await assertCanManagePortability(req, workspaceId, "imports");
    if (req.body.target.mode === "existing_company" && req.body.target.workspaceId !== workspaceId) {
      throw forbidden("Safe import route can only target the route company");
    }
    if (req.body.collisionStrategy === "replace") {
      throw forbidden("Safe import route does not allow replace collision strategy");
    }
    const actor = getActorInfo(req);
    const result = await portability.importBundle(req.body, req.actor.type === "board" ? req.actor.userId : null, {
      mode: "agent_safe",
      sourceCompanyId: workspaceId,
    });
    await logActivity(db, {
      workspaceId: result.company.id,
      actorType: actor.actorType,
      actorId: actor.actorId,
      entityType: "company",
      entityId: result.company.id,
      agentId: actor.agentId,
      runId: actor.runId,
      action: "company.imported",
      details: {
        include: req.body.include ?? null,
        agentCount: result.agents.length,
        warningCount: result.warnings.length,
        companyAction: result.company.action,
        importMode: "agent_safe",
      },
    });
    res.json(result);
  });

  router.post("/", validate(createWorkspaceSchema), async (req, res) => {
    assertBoard(req);
    if (!(req.actor.source === "local_implicit" || req.actor.isInstanceAdmin)) {
      throw forbidden("Instance admin required");
    }
    const company = await svc.create(req.body);
    await access.ensureMembership(company.id, "user", req.actor.userId ?? "local-board", "owner", "active");
    await logActivity(db, {
      workspaceId: company.id,
      actorType: "user",
      actorId: req.actor.userId ?? "board",
      action: "company.created",
      entityType: "company",
      entityId: company.id,
      details: { name: company.name },
    });
    if (company.budgetMonthlyCents > 0) {
      await budgets.upsertPolicy(
        company.id,
        {
          scopeType: "company",
          scopeId: company.id,
          amount: company.budgetMonthlyCents,
          windowKind: "calendar_month_utc",
        },
        req.actor.userId ?? "board",
      );
    }
    res.status(201).json(company);
  });

  router.patch("/:workspaceId", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);

    const actor = getActorInfo(req);
    const existingCompany = await svc.getById(workspaceId);
    if (!existingCompany) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    let body: Record<string, unknown>;

    if (req.actor.type === "agent") {
      // Only CEO agents may update company branding fields
      const agentSvc = agentService(db);
      const actorAgent = req.actor.agentId ? await agentSvc.getById(req.actor.agentId) : null;
      if (!actorAgent || actorAgent.role !== "ceo") {
        throw forbidden("Only CEO agents or board users may update company settings");
      }
      if (actorAgent.workspaceId !== workspaceId) {
        throw forbidden("Agent key cannot access another company");
      }
      body = updateWorkspaceBrandingSchema.parse(req.body);
    } else {
      assertBoard(req);
      body = updateWorkspaceSchema.parse(req.body);

      if (body.feedbackDataSharingEnabled === true && !existingCompany.feedbackDataSharingEnabled) {
        body = {
          ...body,
          feedbackDataSharingConsentAt: new Date(),
          feedbackDataSharingConsentByUserId: req.actor.userId ?? "local-board",
          feedbackDataSharingTermsVersion:
            typeof body.feedbackDataSharingTermsVersion === "string" && body.feedbackDataSharingTermsVersion.length > 0
              ? body.feedbackDataSharingTermsVersion
              : DEFAULT_FEEDBACK_DATA_SHARING_TERMS_VERSION,
        };
      }
    }

    const company = await svc.update(workspaceId, body);
    if (!company) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    // When budgetMetric changes, deactivate all policies using the old metric
    const newMetric = typeof body.budgetMetric === "string" ? body.budgetMetric : null;
    if (newMetric && newMetric !== existingCompany.budgetMetric) {
      await db
        .update(budgetPolicies)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(budgetPolicies.workspaceId, workspaceId),
            eq(budgetPolicies.metric, existingCompany.budgetMetric),
          ),
        );
    }
    await logActivity(db, {
      workspaceId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      action: "company.updated",
      entityType: "company",
      entityId: workspaceId,
      details: body,
    });
    res.json(company);
  });

  router.patch("/:workspaceId/branding", validate(updateWorkspaceBrandingSchema), async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    await assertCanUpdateBranding(req, workspaceId);
    const company = await svc.update(workspaceId, req.body);
    if (!company) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    const actor = getActorInfo(req);
    await logActivity(db, {
      workspaceId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      action: "company.branding_updated",
      entityType: "company",
      entityId: workspaceId,
      details: req.body,
    });
    res.json(company);
  });

  router.post("/:workspaceId/archive", async (req, res) => {
    assertBoard(req);
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const company = await svc.archive(workspaceId);
    if (!company) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    await logActivity(db, {
      workspaceId,
      actorType: "user",
      actorId: req.actor.userId ?? "board",
      action: "company.archived",
      entityType: "company",
      entityId: workspaceId,
    });
    res.json(company);
  });

  router.delete("/:workspaceId", async (req, res) => {
    assertBoard(req);
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const company = await svc.remove(workspaceId);
    if (!company) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    res.json({ ok: true });
  });

  return router;
}
