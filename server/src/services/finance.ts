import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { Db } from "@offwatch/db";
import { agents, costEvents, financeEvents, goals, heartbeatRuns, issues, projects } from "@offwatch/db";
import { notFound, unprocessable } from "../errors.js";

export interface FinanceDateRange {
  from?: Date;
  to?: Date;
}

async function assertBelongsToCompany(
  db: Db,
  table: any,
  id: string,
  workspaceId: string,
  label: string,
) {
  const row = await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .then((rows) => rows[0] ?? null);

  if (!row) throw notFound(`${label} not found`);
  if ((row as unknown as { workspaceId: string }).workspaceId !== workspaceId) {
    throw unprocessable(`${label} does not belong to company`);
  }
}

function rangeConditions(workspaceId: string, range?: FinanceDateRange) {
  const conditions: ReturnType<typeof eq>[] = [eq(financeEvents.workspaceId, workspaceId)];
  if (range?.from) conditions.push(gte(financeEvents.occurredAt, range.from));
  if (range?.to) conditions.push(lte(financeEvents.occurredAt, range.to));
  return conditions;
}

export function financeService(db: Db) {
  const debitExpr = sql<number>`coalesce(sum(case when ${financeEvents.direction} = 'debit' then ${financeEvents.amountCents} else 0 end), 0)::int`;
  const creditExpr = sql<number>`coalesce(sum(case when ${financeEvents.direction} = 'credit' then ${financeEvents.amountCents} else 0 end), 0)::int`;
  const estimatedDebitExpr = sql<number>`coalesce(sum(case when ${financeEvents.direction} = 'debit' and ${financeEvents.estimated} = true then ${financeEvents.amountCents} else 0 end), 0)::int`;

  return {
    createEvent: async (workspaceId: string, data: Omit<typeof financeEvents.$inferInsert, "workspaceId">) => {
      if (data.agentId) await assertBelongsToCompany(db, agents, data.agentId, workspaceId, "Agent");
      if (data.issueId) await assertBelongsToCompany(db, issues, data.issueId, workspaceId, "Issue");
      if (data.projectId) await assertBelongsToCompany(db, projects, data.projectId, workspaceId, "Project");
      if (data.goalId) await assertBelongsToCompany(db, goals, data.goalId, workspaceId, "Goal");
      if (data.heartbeatRunId) await assertBelongsToCompany(db, heartbeatRuns, data.heartbeatRunId, workspaceId, "Heartbeat run");
      if (data.costEventId) await assertBelongsToCompany(db, costEvents, data.costEventId, workspaceId, "Cost event");

      const event = await db
        .insert(financeEvents)
        .values({
          ...data,
          workspaceId,
          currency: data.currency ?? "USD",
          direction: data.direction ?? "debit",
          estimated: data.estimated ?? false,
        })
        .returning()
        .then((rows) => rows[0]);

      return event;
    },

    summary: async (workspaceId: string, range?: FinanceDateRange) => {
      const conditions = rangeConditions(workspaceId, range);
      const [row] = await db
        .select({
          debitCents: debitExpr,
          creditCents: creditExpr,
          estimatedDebitCents: estimatedDebitExpr,
          eventCount: sql<number>`count(*)::int`,
        })
        .from(financeEvents)
        .where(and(...conditions));

      return {
        workspaceId,
        debitCents: Number(row?.debitCents ?? 0),
        creditCents: Number(row?.creditCents ?? 0),
        netCents: Number(row?.debitCents ?? 0) - Number(row?.creditCents ?? 0),
        estimatedDebitCents: Number(row?.estimatedDebitCents ?? 0),
        eventCount: Number(row?.eventCount ?? 0),
      };
    },

    byBiller: async (workspaceId: string, range?: FinanceDateRange) => {
      const conditions = rangeConditions(workspaceId, range);
      return db
        .select({
          biller: financeEvents.biller,
          debitCents: debitExpr,
          creditCents: creditExpr,
          estimatedDebitCents: estimatedDebitExpr,
          eventCount: sql<number>`count(*)::int`,
          kindCount: sql<number>`count(distinct ${financeEvents.eventKind})::int`,
          netCents: sql<number>`(${debitExpr} - ${creditExpr})::int`,
        })
        .from(financeEvents)
        .where(and(...conditions))
        .groupBy(financeEvents.biller)
        .orderBy(desc(sql`(${debitExpr} - ${creditExpr})::int`), financeEvents.biller);
    },

    byKind: async (workspaceId: string, range?: FinanceDateRange) => {
      const conditions = rangeConditions(workspaceId, range);
      return db
        .select({
          eventKind: financeEvents.eventKind,
          debitCents: debitExpr,
          creditCents: creditExpr,
          estimatedDebitCents: estimatedDebitExpr,
          eventCount: sql<number>`count(*)::int`,
          billerCount: sql<number>`count(distinct ${financeEvents.biller})::int`,
          netCents: sql<number>`(${debitExpr} - ${creditExpr})::int`,
        })
        .from(financeEvents)
        .where(and(...conditions))
        .groupBy(financeEvents.eventKind)
        .orderBy(desc(sql`(${debitExpr} - ${creditExpr})::int`), financeEvents.eventKind);
    },

    list: async (workspaceId: string, range?: FinanceDateRange, limit: number = 100) => {
      const conditions = rangeConditions(workspaceId, range);
      return db
        .select()
        .from(financeEvents)
        .where(and(...conditions))
        .orderBy(desc(financeEvents.occurredAt), desc(financeEvents.createdAt))
        .limit(limit);
    },
  };
}
