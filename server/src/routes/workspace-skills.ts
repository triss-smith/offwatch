import { Router, type Request } from "express";
import type { Db } from "@paperclipai/db";
import {
  workspaceSkillCreateSchema,
  workspaceSkillFileUpdateSchema,
  workspaceSkillImportSchema,
  workspaceSkillProjectScanRequestSchema,
} from "@paperclipai/shared";
import { trackSkillImported } from "@paperclipai/shared/telemetry";
import { validate } from "../middleware/validate.js";
import { accessService, agentService, workspaceSkillService, logActivity } from "../services/index.js";
import { forbidden } from "../errors.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import { getTelemetryClient } from "../telemetry.js";

type SkillTelemetryInput = {
  key: string;
  slug: string;
  sourceType: string;
  sourceLocator: string | null;
  metadata: Record<string, unknown> | null;
};

export function workspaceSkillRoutes(db: Db) {
  const router = Router();
  const agents = agentService(db);
  const access = accessService(db);
  const svc = workspaceSkillService(db);

  function canCreateAgents(agent: { permissions: Record<string, unknown> | null | undefined }) {
    if (!agent.permissions || typeof agent.permissions !== "object") return false;
    return Boolean((agent.permissions as Record<string, unknown>).canCreateAgents);
  }

  function asString(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  function deriveTrackedSkillRef(skill: SkillTelemetryInput): string | null {
    if (skill.sourceType === "skills_sh") {
      return skill.key;
    }
    if (skill.sourceType !== "github") {
      return null;
    }
    const hostname = asString(skill.metadata?.hostname);
    if (hostname !== "github.com") {
      return null;
    }
    return skill.key;
  }

  async function assertCanMutateWorkspaceSkills(req: Request, workspaceId: string) {
    assertCompanyAccess(req, workspaceId);

    if (req.actor.type === "board") {
      if (req.actor.source === "local_implicit" || req.actor.isInstanceAdmin) return;
      const allowed = await access.canUser(workspaceId, req.actor.userId, "agents:create");
      if (!allowed) {
        throw forbidden("Missing permission: agents:create");
      }
      return;
    }

    if (!req.actor.agentId) {
      throw forbidden("Agent authentication required");
    }

    const actorAgent = await agents.getById(req.actor.agentId);
    if (!actorAgent || actorAgent.workspaceId !== workspaceId) {
      throw forbidden("Agent key cannot access another company");
    }

    const allowedByGrant = await access.hasPermission(workspaceId, "agent", actorAgent.id, "agents:create");
    if (allowedByGrant || canCreateAgents(actorAgent)) {
      return;
    }

    throw forbidden("Missing permission: can create agents");
  }

  router.get("/workspaces/:workspaceId/skills", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    assertCompanyAccess(req, workspaceId);
    const result = await svc.list(workspaceId);
    res.json(result);
  });

  router.get("/workspaces/:workspaceId/skills/:skillId", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    const skillId = req.params.skillId as string;
    assertCompanyAccess(req, workspaceId);
    const result = await svc.detail(workspaceId, skillId);
    if (!result) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }
    res.json(result);
  });

  router.get("/workspaces/:workspaceId/skills/:skillId/update-status", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    const skillId = req.params.skillId as string;
    assertCompanyAccess(req, workspaceId);
    const result = await svc.updateStatus(workspaceId, skillId);
    if (!result) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }
    res.json(result);
  });

  router.get("/workspaces/:workspaceId/skills/:skillId/files", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    const skillId = req.params.skillId as string;
    const relativePath = String(req.query.path ?? "SKILL.md");
    assertCompanyAccess(req, workspaceId);
    const result = await svc.readFile(workspaceId, skillId, relativePath);
    if (!result) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }
    res.json(result);
  });

  router.post(
    "/workspaces/:workspaceId/skills",
    validate(workspaceSkillCreateSchema),
    async (req, res) => {
      const workspaceId = req.params.workspaceId as string;
      await assertCanMutateWorkspaceSkills(req, workspaceId);
      const result = await svc.createLocalSkill(workspaceId, req.body);

      const actor = getActorInfo(req);
      await logActivity(db, {
        workspaceId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: "company.skill_created",
        entityType: "company_skill",
        entityId: result.id,
        details: {
          slug: result.slug,
          name: result.name,
        },
      });

      res.status(201).json(result);
    },
  );

  router.patch(
    "/workspaces/:workspaceId/skills/:skillId/files",
    validate(workspaceSkillFileUpdateSchema),
    async (req, res) => {
      const workspaceId = req.params.workspaceId as string;
      const skillId = req.params.skillId as string;
      await assertCanMutateWorkspaceSkills(req, workspaceId);
      const result = await svc.updateFile(
        workspaceId,
        skillId,
        String(req.body.path ?? ""),
        String(req.body.content ?? ""),
      );

      const actor = getActorInfo(req);
      await logActivity(db, {
        workspaceId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: "company.skill_file_updated",
        entityType: "company_skill",
        entityId: skillId,
        details: {
          path: result.path,
          markdown: result.markdown,
        },
      });

      res.json(result);
    },
  );

  router.post(
    "/workspaces/:workspaceId/skills/import",
    validate(workspaceSkillImportSchema),
    async (req, res) => {
      const workspaceId = req.params.workspaceId as string;
      await assertCanMutateWorkspaceSkills(req, workspaceId);
      const source = String(req.body.source ?? "");
      const result = await svc.importFromSource(workspaceId, source);

      const actor = getActorInfo(req);
      await logActivity(db, {
        workspaceId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: "company.skills_imported",
        entityType: "company",
        entityId: workspaceId,
        details: {
          source,
          importedCount: result.imported.length,
          importedSlugs: result.imported.map((skill) => skill.slug),
          warningCount: result.warnings.length,
        },
      });
      const telemetryClient = getTelemetryClient();
      if (telemetryClient) {
        for (const skill of result.imported) {
          trackSkillImported(telemetryClient, {
            sourceType: skill.sourceType,
            skillRef: deriveTrackedSkillRef(skill),
          });
        }
      }

      res.status(201).json(result);
    },
  );

  router.post(
    "/workspaces/:workspaceId/skills/scan-projects",
    validate(workspaceSkillProjectScanRequestSchema),
    async (req, res) => {
      const workspaceId = req.params.workspaceId as string;
      await assertCanMutateWorkspaceSkills(req, workspaceId);
      const result = await svc.scanProjectWorkspaces(workspaceId, req.body);

      const actor = getActorInfo(req);
      await logActivity(db, {
        workspaceId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: "company.skills_scanned",
        entityType: "company",
        entityId: workspaceId,
        details: {
          scannedProjects: result.scannedProjects,
          scannedWorkspaces: result.scannedWorkspaces,
          discovered: result.discovered,
          importedCount: result.imported.length,
          updatedCount: result.updated.length,
          conflictCount: result.conflicts.length,
          warningCount: result.warnings.length,
        },
      });

      res.json(result);
    },
  );

  router.delete("/workspaces/:workspaceId/skills/:skillId", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    const skillId = req.params.skillId as string;
    await assertCanMutateWorkspaceSkills(req, workspaceId);
    const result = await svc.deleteSkill(workspaceId, skillId);
    if (!result) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }

    const actor = getActorInfo(req);
    await logActivity(db, {
      workspaceId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      action: "company.skill_deleted",
      entityType: "company_skill",
      entityId: result.id,
      details: {
        slug: result.slug,
        name: result.name,
      },
    });

    res.json(result);
  });

  router.post("/workspaces/:workspaceId/skills/:skillId/install-update", async (req, res) => {
    const workspaceId = req.params.workspaceId as string;
    const skillId = req.params.skillId as string;
    await assertCanMutateWorkspaceSkills(req, workspaceId);
    const result = await svc.installUpdate(workspaceId, skillId);
    if (!result) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }

    const actor = getActorInfo(req);
    await logActivity(db, {
      workspaceId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      action: "company.skill_update_installed",
      entityType: "company_skill",
      entityId: result.id,
      details: {
        slug: result.slug,
        sourceRef: result.sourceRef,
      },
    });

    res.json(result);
  });

  return router;
}
