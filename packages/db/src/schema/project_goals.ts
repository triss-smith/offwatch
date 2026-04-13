import { pgTable, uuid, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.js";
import { projects } from "./projects.js";
import { goals } from "./goals.js";

export const projectGoals = pgTable(
  "project_goals",
  {
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.projectId, table.goalId] }),
    projectIdx: index("project_goals_project_idx").on(table.projectId),
    goalIdx: index("project_goals_goal_idx").on(table.goalId),
    workspaceIdx: index("project_goals_workspace_idx").on(table.workspaceId),
  }),
);
