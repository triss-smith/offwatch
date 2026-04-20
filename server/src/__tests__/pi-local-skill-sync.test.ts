import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listPiSkills,
  syncPiSkills,
} from "@offwatch/adapter-pi-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("pi local skill sync", () => {
  const offwatchKey = "offwatchai/offwatch/offwatch";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Offwatch skills and installs them into the Pi skills home", async () => {
    const home = await makeTempDir("offwatch-pi-skill-sync-");
    cleanupDirs.add(home);

    const ctx = {
      agentId: "agent-1",
      workspaceId: "workspace-1",
      adapterType: "pi_local",
      config: {
        env: {
          HOME: home,
        },
        offwatchSkillSync: {
          desiredSkills: [offwatchKey],
        },
      },
    } as const;

    const before = await listPiSkills(ctx);
    expect(before.mode).toBe("persistent");
    expect(before.desiredSkills).toContain(offwatchKey);
    expect(before.entries.find((entry) => entry.key === offwatchKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === offwatchKey)?.state).toBe("missing");

    const after = await syncPiSkills(ctx, [offwatchKey]);
    expect(after.entries.find((entry) => entry.key === offwatchKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".pi", "agent", "skills", "offwatch"))).isSymbolicLink()).toBe(true);
  });

  it("keeps required bundled Offwatch skills installed even when the desired set is emptied", async () => {
    const home = await makeTempDir("offwatch-pi-skill-prune-");
    cleanupDirs.add(home);

    const configuredCtx = {
      agentId: "agent-2",
      workspaceId: "workspace-1",
      adapterType: "pi_local",
      config: {
        env: {
          HOME: home,
        },
        offwatchSkillSync: {
          desiredSkills: [offwatchKey],
        },
      },
    } as const;

    await syncPiSkills(configuredCtx, [offwatchKey]);

    const clearedCtx = {
      ...configuredCtx,
      config: {
        env: {
          HOME: home,
        },
        offwatchSkillSync: {
          desiredSkills: [],
        },
      },
    } as const;

    const after = await syncPiSkills(clearedCtx, []);
    expect(after.desiredSkills).toContain(offwatchKey);
    expect(after.entries.find((entry) => entry.key === offwatchKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".pi", "agent", "skills", "offwatch"))).isSymbolicLink()).toBe(true);
  });
});
