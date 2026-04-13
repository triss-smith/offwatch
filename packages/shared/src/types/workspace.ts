import type { CompanyStatus } from "../constants.js";

export interface Workspace {
  id: string;
  name: string;
  status: CompanyStatus;
  issuePrefix: string;
  issueCounter: number;
  requireBoardApprovalForNewAgents: boolean;
  brandColor: string | null;
  issueTrackerConfig: Record<string, unknown> | null;
  repoPath: string | null;
  worktreesPath: string | null;
  createdAt: Date;
  updatedAt: Date;
}
