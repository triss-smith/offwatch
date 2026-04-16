import { eq } from "drizzle-orm";
import type { Db } from "@offwatch/db";
import { assets } from "@offwatch/db";

export function assetService(db: Db) {
  return {
    create: (workspaceId: string, data: Omit<typeof assets.$inferInsert, "workspaceId">) =>
      db
        .insert(assets)
        .values({ ...data, workspaceId })
        .returning()
        .then((rows) => rows[0]),

    getById: (id: string) =>
      db
        .select()
        .from(assets)
        .where(eq(assets.id, id))
        .then((rows) => rows[0] ?? null),
  };
}

