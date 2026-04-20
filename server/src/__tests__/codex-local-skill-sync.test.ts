import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listCodexSkills,
  syncCodexSkills,
} from "@offwatch/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("codex local skill sync", () => {
  const offwatchKey = "offwatchai/offwatch/offwatch";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Offwatch skills for workspace injection on the next run", async () => {
    const codexHome = await makeTempDir("offwatch-codex-skill-sync-");
    cleanupDirs.add(codexHome);

    const ctx = {
      agentId: "agent-1",
      workspaceId: "workspace-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        offwatchSkillSync: {
          desiredSkills: [offwatchKey],
        },
      },
    } as const;

    const before = await listCodexSkills(ctx);
    expect(before.mode).toBe("ephemeral");
    expect(before.desiredSkills).toContain(offwatchKey);
    expect(before.entries.find((entry) => entry.key === offwatchKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === offwatchKey)?.state).toBe("configured");
    expect(before.entries.find((entry) => entry.key === offwatchKey)?.detail).toContain("CODEX_HOME/skills/");
  });

  it("does not persist Offwatch skills into CODEX_HOME during sync", async () => {
    const codexHome = await makeTempDir("offwatch-codex-skill-prune-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      workspaceId: "workspace-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        offwatchSkillSync: {
          desiredSkills: [offwatchKey],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, [offwatchKey]);
    expect(after.mode).toBe("ephemeral");
    expect(after.entries.find((entry) => entry.key === offwatchKey)?.state).toBe("configured");
    await expect(fs.lstat(path.join(codexHome, "skills", "offwatch"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("keeps required bundled Offwatch skills configured even when the desired set is emptied", async () => {
    const codexHome = await makeTempDir("offwatch-codex-skill-required-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      workspaceId: "workspace-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        offwatchSkillSync: {
          desiredSkills: [],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, []);
    expect(after.desiredSkills).toContain(offwatchKey);
    expect(after.entries.find((entry) => entry.key === offwatchKey)?.state).toBe("configured");
  });

  it("normalizes legacy flat Offwatch skill refs before reporting configured state", async () => {
    const codexHome = await makeTempDir("offwatch-codex-legacy-skill-sync-");
    cleanupDirs.add(codexHome);

    const snapshot = await listCodexSkills({
      agentId: "agent-3",
      workspaceId: "workspace-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        offwatchSkillSync: {
          desiredSkills: ["offwatch"],
        },
      },
    });

    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.desiredSkills).toContain(offwatchKey);
    expect(snapshot.desiredSkills).not.toContain("offwatch");
    expect(snapshot.entries.find((entry) => entry.key === offwatchKey)?.state).toBe("configured");
    expect(snapshot.entries.find((entry) => entry.key === "offwatch")).toBeUndefined();
  });
});
