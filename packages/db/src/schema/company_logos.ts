import { pgTable, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces.js";
import { assets } from "./assets.js";

export const companyLogos = pgTable(
  "company_logos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    workspaceUq: uniqueIndex("company_logos_workspace_uq").on(table.workspaceId),
    assetUq: uniqueIndex("company_logos_asset_uq").on(table.assetId),
  }),
);
