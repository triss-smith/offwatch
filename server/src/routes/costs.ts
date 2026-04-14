import { Router } from "express";
import type { Db } from "@paperclipai/db";
import {
  createCostEventSchema,
  createFinanceEventSchema,
  resolveBudgetIncidentSchema,
  updateBudgetSchema,
  upsertBudgetPolicySchema,
} from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import {
  budgetService,
  costService,
  financeService,
  workspaceService,
  agentService,
  heartbeatService,
  logActivity,
} from "../services/index.js";
import { assertBoard, assertCompanyAccess, getActorInfo } from "./authz.js";
import { fetchAllQuotaWindows } from "../services/quota-windows.js";
import { badRequest } from "../errors.js";

export function parseCostDateRange(query: Record<string, unknown>) {
  const fromRaw = query.from as string | undefined;
  const toRaw = query.to as string | undefined;
  const from = fromRaw ? new Date(fromRaw) : undefined;
  const to = toRaw ? new Date(toRaw) : undefined;
  if (from && isNaN(from.getTime())) throw badRequest("invalid 'from' date");
  if (to && isNaN(to.getTime())) throw badRequest("invalid 'to' date");
  return (from || to) ? { from, to } : undefined;
}

export function parseCostLimit(query: Record<string, unknown>) {
  const raw = Array.isArray(query.limit) ? query.limit[0] : query.limit;
  if (raw == null || raw === "") return 100;
  const limit = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(limit) || limit <= 0 || limit > 500) {
    throw badRequest("invalid 'limit' value");
  }
  return limit;
}

export function costRoutes(db: Db) {
  const router = Router();
  const heartbeat = heartbeatService(db);
  const budgetHooks = {
    cancelWorkForScope: heartbeat.cancelBudgetScopeWork,
  };
  const costs = costService(db, budgetHooks);
  const finance = financeService(db);
  const budgets = budgetService(db, budgetHooks);
  const workspaces = workspaceService(db);
  const agents = agentService(db);

  router.post("/workspaces/:workspaceId/cost-events", validate(createCostEventSchema), async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);

    if (req.actor.type === "agent" && req.actor.agentId !== req.body.agentId) {
      res.status(403).json({ error: "Agent can only report its own costs" });
      return;
    }

    const event = await costs.createEvent(workspaceId, {
      ...req.body,
      occurredAt: new Date(req.body.occurredAt),
    });

    const actor = getActorInfo(req);
    await logActivity(db, {
      workspaceId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "cost.reported",
      entityType: "cost_event",
      entityId: event.id,
      details: { costCents: event.costCents, model: event.model },
    });

    res.status(201).json(event);
  });

  router.post("/workspaces/:workspaceId/finance-events", validate(createFinanceEventSchema), async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    assertBoard(req);

    const event = await finance.createEvent(workspaceId, {
      ...req.body,
      occurredAt: new Date(req.body.occurredAt),
    });

    const actor = getActorInfo(req);
    await logActivity(db, {
      workspaceId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "finance_event.reported",
      entityType: "finance_event",
      entityId: event.id,
      details: {
        amountCents: event.amountCents,
        biller: event.biller,
        eventKind: event.eventKind,
        direction: event.direction,
      },
    });

    res.status(201).json(event);
  });

  router.get("/workspaces/:workspaceId/costs/summary", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const range = parseCostDateRange(req.query);
    const summary = await costs.summary(workspaceId, range);
    res.json(summary);
  });

  router.get("/workspaces/:workspaceId/costs/by-agent", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const range = parseCostDateRange(req.query);
    const rows = await costs.byAgent(workspaceId, range);
    res.json(rows);
  });

  router.get("/workspaces/:workspaceId/costs/by-agent-model", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const range = parseCostDateRange(req.query);
    const rows = await costs.byAgentModel(workspaceId, range);
    res.json(rows);
  });

  router.get("/workspaces/:workspaceId/costs/by-provider", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const range = parseCostDateRange(req.query);
    const rows = await costs.byProvider(workspaceId, range);
    res.json(rows);
  });

  router.get("/workspaces/:workspaceId/costs/by-biller", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const range = parseCostDateRange(req.query);
    const rows = await costs.byBiller(workspaceId, range);
    res.json(rows);
  });

  router.get("/workspaces/:workspaceId/costs/finance-summary", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const range = parseCostDateRange(req.query);
    const summary = await finance.summary(workspaceId, range);
    res.json(summary);
  });

  router.get("/workspaces/:workspaceId/costs/finance-by-biller", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const range = parseCostDateRange(req.query);
    const rows = await finance.byBiller(workspaceId, range);
    res.json(rows);
  });

  router.get("/workspaces/:workspaceId/costs/finance-by-kind", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const range = parseCostDateRange(req.query);
    const rows = await finance.byKind(workspaceId, range);
    res.json(rows);
  });

  router.get("/workspaces/:workspaceId/costs/finance-events", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const range = parseCostDateRange(req.query);
    const limit = parseCostLimit(req.query);
    const rows = await finance.list(workspaceId, range, limit);
    res.json(rows);
  });

  router.get("/workspaces/:workspaceId/costs/window-spend", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const rows = await costs.windowSpend(workspaceId);
    res.json(rows);
  });

  router.get("/workspaces/:workspaceId/costs/quota-windows", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    assertBoard(req);
    // validate workspaceId resolves to a real company so the "__none__" sentinel
    // and any forged ids are rejected before we touch provider credentials
    const company = await workspaces.getById(workspaceId);
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    const results = await fetchAllQuotaWindows();
    res.json(results);
  });

  router.get("/workspaces/:workspaceId/budgets/overview", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const overview = await budgets.overview(workspaceId);
    res.json(overview);
  });

  router.post(
    "/workspaces/:workspaceId/budgets/policies",
    validate(upsertBudgetPolicySchema),
    async (req, res) => {
      assertBoard(req);
      const workspaceId = req.params.workspaceId as string;
      assertCompanyAccess(req, workspaceId);
      const summary = await budgets.upsertPolicy(workspaceId, req.body, req.actor.userId ?? "board");
      res.json(summary);
    },
  );

  router.post(
    "/workspaces/:workspaceId/budget-incidents/:incidentId/resolve",
    validate(resolveBudgetIncidentSchema),
    async (req, res) => {
      assertBoard(req);
      const workspaceId = req.params.workspaceId as string;
      const incidentId = req.params.incidentId as string;
      assertCompanyAccess(req, workspaceId);
      const incident = await budgets.resolveIncident(workspaceId, incidentId, req.body, req.actor.userId ?? "board");
      res.json(incident);
    },
  );

  router.get("/workspaces/:workspaceId/costs/by-project", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const range = parseCostDateRange(req.query);
    const rows = await costs.byProject(workspaceId, range);
    res.json(rows);
  });

  return router;
}
