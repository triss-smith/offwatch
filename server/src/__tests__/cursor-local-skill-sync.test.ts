import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listCursorSkills,
  syncCursorSkills,
} from "@offwatch/adapter-cursor-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function createSkillDir(root: string, name: string) {
  const skillDir = path.join(root, name);
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(path.join(skillDir, "SKILL.md"), `---\nname: ${name}\n---\n`, "utf8");
  return skillDir;
}

describe("cursor local skill sync", () => {
  const offwatchKey = "offwatchai/offwatch/offwatch";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Offwatch skills and installs them into the Cursor skills home", async () => {
    const home = await makeTempDir("offwatch-cursor-skill-sync-");
    cleanupDirs.add(home);

    const ctx = {
      agentId: "agent-1",
      workspaceId: "workspace-1",
      adapterType: "cursor",
      config: {
        env: {
          HOME: home,
        },
        offwatchSkillSync: {
          desiredSkills: [offwatchKey],
        },
      },
    } as const;

    const before = await listCursorSkills(ctx);
    expect(before.mode).toBe("persistent");
    expect(before.desiredSkills).toContain(offwatchKey);
    expect(before.entries.find((entry) => entry.key === offwatchKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === offwatchKey)?.state).toBe("missing");

    const after = await syncCursorSkills(ctx, [offwatchKey]);
    expect(after.entries.find((entry) => entry.key === offwatchKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".cursor", "skills", "offwatch"))).isSymbolicLink()).toBe(true);
  });

  it("recognizes company-library runtime skills supplied outside the bundled Offwatch directory", async () => {
    const home = await makeTempDir("offwatch-cursor-runtime-skills-home-");
    const runtimeSkills = await makeTempDir("offwatch-cursor-runtime-skills-src-");
    cleanupDirs.add(home);
    cleanupDirs.add(runtimeSkills);

    const offwatchDir = await createSkillDir(runtimeSkills, "offwatch");
    const asciiHeartDir = await createSkillDir(runtimeSkills, "ascii-heart");

    const ctx = {
      agentId: "agent-3",
      workspaceId: "workspace-1",
      adapterType: "cursor",
      config: {
        env: {
          HOME: home,
        },
        offwatchRuntimeSkills: [
          {
            key: "offwatch",
            runtimeName: "offwatch",
            source: offwatchDir,
            required: true,
            requiredReason: "Bundled Offwatch skills are always available for local adapters.",
          },
          {
            key: "ascii-heart",
            runtimeName: "ascii-heart",
            source: asciiHeartDir,
          },
        ],
        offwatchSkillSync: {
          desiredSkills: ["ascii-heart"],
        },
      },
    } as const;

    const before = await listCursorSkills(ctx);
    expect(before.warnings).toEqual([]);
    expect(before.desiredSkills).toEqual(["offwatch", "ascii-heart"]);
    expect(before.entries.find((entry) => entry.key === "ascii-heart")?.state).toBe("missing");

    const after = await syncCursorSkills(ctx, ["ascii-heart"]);
    expect(after.warnings).toEqual([]);
    expect(after.entries.find((entry) => entry.key === "ascii-heart")?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".cursor", "skills", "ascii-heart"))).isSymbolicLink()).toBe(true);
  });

  it("keeps required bundled Offwatch skills installed even when the desired set is emptied", async () => {
    const home = await makeTempDir("offwatch-cursor-skill-prune-");
    cleanupDirs.add(home);

    const configuredCtx = {
      agentId: "agent-2",
      workspaceId: "workspace-1",
      adapterType: "cursor",
      config: {
        env: {
          HOME: home,
        },
        offwatchSkillSync: {
          desiredSkills: [offwatchKey],
        },
      },
    } as const;

    await syncCursorSkills(configuredCtx, [offwatchKey]);

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

    const after = await syncCursorSkills(clearedCtx, []);
    expect(after.desiredSkills).toContain(offwatchKey);
    expect(after.entries.find((entry) => entry.key === offwatchKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".cursor", "skills", "offwatch"))).isSymbolicLink()).toBe(true);
  });
});
