import { pgTable, uuid, text, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.js";
import { agents } from "./agents.js";
import { heartbeatRuns } from "./heartbeat_runs.js";

export const agentTaskSessions = pgTable(
  "agent_task_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    agentId: uuid("agent_id").notNull().references(() => agents.id),
    adapterType: text("adapter_type").notNull(),
    taskKey: text("task_key").notNull(),
    sessionParamsJson: jsonb("session_params_json").$type<Record<string, unknown>>(),
    sessionDisplayId: text("session_display_id"),
    lastRunId: uuid("last_run_id").references(() => heartbeatRuns.id),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    workspaceAgentTaskUniqueIdx: uniqueIndex("agent_task_sessions_workspace_agent_adapter_task_uniq").on(
      table.workspaceId,
      table.agentId,
      table.adapterType,
      table.taskKey,
    ),
    workspaceAgentUpdatedIdx: index("agent_task_sessions_workspace_agent_updated_idx").on(
      table.workspaceId,
      table.agentId,
      table.updatedAt,
    ),
    workspaceTaskUpdatedIdx: index("agent_task_sessions_workspace_task_updated_idx").on(
      table.workspaceId,
      table.taskKey,
      table.updatedAt,
    ),
  }),
);
