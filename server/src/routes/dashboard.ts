import { Router } from "express";
import type { Db } from "@paperclipai/db";
import { dashboardService } from "../services/dashboard.js";
import { assertCompanyAccess } from "./authz.js";

export function dashboardRoutes(db: Db) {
  const router = Router();
  const svc = dashboardService(db);

  router.get("/workspaces/:workspaceId/dashboard", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const summary = await svc.summary(workspaceId);
    res.json(summary);
  });

  return router;
}
