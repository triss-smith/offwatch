import path from "node:path";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import * as childProcess from "node:child_process";
import fs from "node:fs/promises";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

vi.mock("node:fs/promises", () => {
  const accessMock = vi.fn();
  const mkdirMock = vi.fn();
  return {
    default: { access: accessMock, mkdir: mkdirMock },
  };
});

let createWorktree: typeof import("../services/worktree.js").createWorktree;
let removeWorktree: typeof import("../services/worktree.js").removeWorktree;

beforeAll(async () => {
  const mod = await import("../services/worktree.js");
  createWorktree = mod.createWorktree;
  removeWorktree = mod.removeWorktree;
});

describe("createWorktree", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns existing worktree path if directory already exists", async () => {
    vi.mocked(fs).access.mockResolvedValueOnce(undefined);
    const result = await createWorktree("/repo", "/worktrees", "smith/LIN-1-fix");
    expect(result.worktreePath).toBe(path.join("/worktrees", "smith/LIN-1-fix"));
    expect(childProcess.execFile).not.toHaveBeenCalled();
  });

  it("creates new branch and worktree when branch does not exist", async () => {
    vi.mocked(fs).access.mockRejectedValueOnce(new Error("ENOENT"));
    vi.mocked(fs).mkdir.mockResolvedValueOnce(undefined);
    const mockExecFile = vi.mocked(childProcess.execFile);
    // rev-parse fails — branch doesn't exist
    mockExecFile.mockImplementationOnce((_cmd, _args, cb) => (cb as Function)(new Error("not found")));
    // worktree add -b succeeds
    mockExecFile.mockImplementationOnce((_cmd, _args, cb) => (cb as Function)(null, "", ""));
    const result = await createWorktree("/repo", "/worktrees", "smith/LIN-1-fix");
    expect(result.worktreePath).toBe(path.join("/worktrees", "smith/LIN-1-fix"));
    expect(mockExecFile).toHaveBeenCalledTimes(2);
    // Second call should use -b flag to create branch
    const secondCall = mockExecFile.mock.calls[1];
    expect(secondCall[1]).toContain("-b");
    expect(secondCall[1]).toContain("smith/LIN-1-fix");
  });

  it("adds existing branch to worktree when branch already exists", async () => {
    vi.mocked(fs).access.mockRejectedValueOnce(new Error("ENOENT"));
    vi.mocked(fs).mkdir.mockResolvedValueOnce(undefined);
    const mockExecFile = vi.mocked(childProcess.execFile);
    // rev-parse succeeds — branch exists
    mockExecFile.mockImplementationOnce((_cmd, _args, cb) => (cb as Function)(null, "abc123\n", ""));
    // worktree add succeeds (no -b)
    mockExecFile.mockImplementationOnce((_cmd, _args, cb) => (cb as Function)(null, "", ""));
    const result = await createWorktree("/repo", "/worktrees", "smith/LIN-1-fix");
    expect(result.worktreePath).toBe(path.join("/worktrees", "smith/LIN-1-fix"));
    expect(mockExecFile).toHaveBeenCalledTimes(2);
    // Second call should NOT use -b flag
    const secondCall = mockExecFile.mock.calls[1];
    expect(secondCall[1]).not.toContain("-b");
  });
});

describe("removeWorktree", () => {
  beforeEach(() => vi.resetAllMocks());

  it("calls git worktree remove with --force", async () => {
    const mockExecFile = vi.mocked(childProcess.execFile);
    mockExecFile.mockImplementationOnce((_cmd, _args, cb) => (cb as Function)(null, "", ""));
    await removeWorktree("/repo", "/worktrees/smith/LIN-1-fix");
    expect(mockExecFile).toHaveBeenCalledWith(
      "git",
      ["-C", "/repo", "worktree", "remove", "/worktrees/smith/LIN-1-fix", "--force"],
      expect.any(Function),
    );
  });
});
