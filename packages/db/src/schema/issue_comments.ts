import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.js";
import { issues } from "./issues.js";
import { agents } from "./agents.js";
import { heartbeatRuns } from "./heartbeat_runs.js";

export const issueComments = pgTable(
  "issue_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    issueId: uuid("issue_id").notNull().references(() => issues.id),
    authorAgentId: uuid("author_agent_id").references(() => agents.id),
    authorUserId: text("author_user_id"),
    createdByRunId: uuid("created_by_run_id").references(() => heartbeatRuns.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    issueIdx: index("issue_comments_issue_idx").on(table.issueId),
    workspaceIdx: index("issue_comments_workspace_idx").on(table.workspaceId),
    workspaceIssueCreatedAtIdx: index("issue_comments_workspace_issue_created_at_idx").on(
      table.workspaceId,
      table.issueId,
      table.createdAt,
    ),
    workspaceAuthorIssueCreatedAtIdx: index("issue_comments_workspace_author_issue_created_at_idx").on(
      table.workspaceId,
      table.authorUserId,
      table.issueId,
      table.createdAt,
    ),
    bodySearchIdx: index("issue_comments_body_search_idx").using("gin", table.body.op("gin_trgm_ops")),
  }),
);
