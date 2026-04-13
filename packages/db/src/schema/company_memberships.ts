import { pgTable, uuid, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.js";

export const companyMemberships = pgTable(
  "company_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
    principalType: text("principal_type").notNull(),
    principalId: text("principal_id").notNull(),
    status: text("status").notNull().default("active"),
    membershipRole: text("membership_role"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    workspacePrincipalUniqueIdx: uniqueIndex("company_memberships_workspace_principal_unique_idx").on(
      table.workspaceId,
      table.principalType,
      table.principalId,
    ),
    principalStatusIdx: index("company_memberships_principal_status_idx").on(
      table.principalType,
      table.principalId,
      table.status,
    ),
    workspaceStatusIdx: index("company_memberships_workspace_status_idx").on(table.workspaceId, table.status),
  }),
);
