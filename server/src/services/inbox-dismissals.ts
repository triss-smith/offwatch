import { and, desc, eq } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { inboxDismissals } from "@paperclipai/db";

export function inboxDismissalService(db: Db) {
  return {
    list: async (workspaceId: string, userId: string) =>
      db
        .select()
        .from(inboxDismissals)
        .where(and(eq(inboxDismissals.workspaceId, workspaceId), eq(inboxDismissals.userId, userId)))
        .orderBy(desc(inboxDismissals.updatedAt)),

    dismiss: async (
      workspaceId: string,
      userId: string,
      itemKey: string,
      dismissedAt: Date = new Date(),
    ) => {
      const now = new Date();
      const [row] = await db
        .insert(inboxDismissals)
        .values({
          workspaceId,
          userId,
          itemKey,
          dismissedAt,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [inboxDismissals.workspaceId, inboxDismissals.userId, inboxDismissals.itemKey],
          set: {
            dismissedAt,
            updatedAt: now,
          },
        })
        .returning();
      return row;
    },
  };
}
