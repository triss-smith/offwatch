import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";

const execFileAsync = promisify(execFile);

export interface WorktreeCreateResult {
  worktreePath: string;
}

/**
 * Creates a git worktree for an issue branch.
 * The worktree is placed at {worktreesPath}/{branchName}.
 * Creates the branch if it does not already exist in the repo.
 *
 * @param repoPath - Absolute path to the main git repository clone
 * @param worktreesPath - Absolute path to the directory that holds all worktrees
 * @param branchName - Full branch name (e.g. "smith/LIN-123-fix-auth")
 */
export async function createWorktree(
  repoPath: string,
  worktreesPath: string,
  branchName: string,
): Promise<WorktreeCreateResult> {
  const worktreePath = path.join(worktreesPath, branchName);

  // Check if the worktree already exists
  try {
    await fs.access(worktreePath);
    // Already exists — return existing path
    return { worktreePath };
  } catch {
    // Does not exist — create it
  }

  // Ensure the parent directory exists
  await fs.mkdir(path.dirname(worktreePath), { recursive: true });

  // Check if the branch already exists
  let branchExists = false;
  try {
    await execFileAsync("git", ["-C", repoPath, "rev-parse", "--verify", branchName]);
    branchExists = true;
  } catch {
    branchExists = false;
  }

  if (branchExists) {
    await execFileAsync("git", ["-C", repoPath, "worktree", "add", worktreePath, branchName]);
  } else {
    await execFileAsync("git", ["-C", repoPath, "worktree", "add", "-b", branchName, worktreePath]);
  }

  return { worktreePath };
}

/**
 * Removes a git worktree and cleans up the directory.
 *
 * @param repoPath - Absolute path to the main git repository clone
 * @param worktreePath - Absolute path to the worktree to remove
 */
export async function removeWorktree(
  repoPath: string,
  worktreePath: string,
): Promise<void> {
  await execFileAsync("git", ["-C", repoPath, "worktree", "remove", worktreePath, "--force"]);
}
