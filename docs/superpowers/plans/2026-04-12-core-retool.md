# Core Retool — Personal Orchestration Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retool Paperclip Lite from a multi-company AI workforce platform into a personal orchestration tool — rename `companies` → `workspaces`, strip org hierarchy, add issue tracker fields, git worktree isolation, and simplified approvals.

**Architecture:** Database-first — every task starts with a schema or migration change, then propagates to services, routes, shared types, and UI in that order. The company→workspace rename is the biggest mechanical change; it is done as a dedicated migration + Drizzle schema update before any TypeScript rename. New features (linked issue fields, worktrees, events) are additive and sit on top of the renamed foundation.

**Tech Stack:** PostgreSQL + Drizzle ORM (migrations via `pnpm db:generate` + manual SQL edits for renames), Express.js services and routes, `@paperclipai/shared` for types, React + TanStack Query for UI. Tests use Vitest.

> **Note on naming:** This plan uses "workspace" as the new top-level container name. Paperclip already has `execution_workspaces` and `project_workspaces` — these are sub-concepts and keep their names. Context makes the distinction clear.

---

## File Map

### New files
- `packages/db/src/schema/workspaces.ts` — renamed from `companies.ts`, stripped of budget/hierarchy columns, with new tracker/repo config columns
- `server/src/routes/workspaces.ts` — renamed from `companies.ts`
- `server/src/services/workspaces.ts` — renamed from `companies.ts`
- `ui/src/api/workspaces.ts` — renamed from `companies.ts`
- `ui/src/pages/Workspaces.tsx` — renamed from `Companies.tsx`
- `ui/src/pages/WorkspaceSettings.tsx` — renamed from `CompanySettings.tsx`
- `server/src/services/worktree.ts` — new: git worktree create/remove operations
- `server/src/services/issue-events.ts` — new: emit `issue.checkedout` and `issue.completed` events

### Modified files
- `packages/db/src/schema/agents.ts` — remove `reportsTo`, `budgetMonthlyCents`, `spentMonthlyCents`
- `packages/db/src/schema/issues.ts` — add `linkedExternalId`, `linkedExternalUrl`, `linkedBranchName`, `worktreePath`; rename `companyId` ref
- `packages/db/src/schema/approvals.ts` — rename `companyId` ref
- `packages/db/src/schema/index.ts` — update export for workspaces
- `packages/shared/src/types/approval.ts` — rename `companyId` field
- `packages/shared/src/constants.ts` — add `tracker_issue_proposal`, `create_agent` to `APPROVAL_TYPES`; remove `hire_agent`, `approve_ceo_strategy`, `budget_override_required`, `request_board_approval`
- `server/src/routes/issues.ts` — emit events on checkout and `done` transition
- `server/src/routes/index.ts` — swap company routes for workspace routes
- `ui/src/pages/OrgChart.tsx` — deleted
- `ui/src/pages/Goals.tsx` — deleted
- `ui/src/pages/GoalDetail.tsx` — deleted
- `ui/src/pages/Org.tsx` — deleted (org chart container)
- `ui/src/pages/Costs.tsx` — deleted (budget salary tracking)
- `ui/src/pages/NewAgent.tsx` — remove `reportsTo` and budget fields
- `ui/src/pages/AgentDetail.tsx` — remove `reportsTo` and budget fields

---

## Task 1: Add new columns to issues and companies tables

**Files:**
- Create: `packages/db/src/migrations/0057_workspace_tracker_fields.sql`
- Modify: `packages/db/src/schema/issues.ts`
- Modify: `packages/db/src/schema/companies.ts`

- [ ] **Step 1: Add columns to the Drizzle schema for issues**

In `packages/db/src/schema/issues.ts`, add these four fields inside the `pgTable` column map, after `hiddenAt`:

```ts
linkedExternalId: text("linked_external_id"),
linkedExternalUrl: text("linked_external_url"),
linkedBranchName: text("linked_branch_name"),
worktreePath: text("worktree_path"),
```

- [ ] **Step 2: Add columns to the Drizzle schema for companies**

In `packages/db/src/schema/companies.ts`, add after `brandColor`:

```ts
issueTrackerConfig: jsonb("issue_tracker_config").$type<Record<string, unknown>>(),
repoPath: text("repo_path"),
worktreesPath: text("worktrees_path"),
```

Add `jsonb` to the import at the top of the file:
```ts
import { pgTable, uuid, text, integer, timestamp, boolean, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
```

- [ ] **Step 3: Generate the migration**

```bash
pnpm db:generate
```

Expected: a new file appears in `packages/db/src/migrations/` named something like `0057_*.sql`.

- [ ] **Step 4: Verify the generated SQL is additive only**

Open the generated file. It should contain only `ALTER TABLE ... ADD COLUMN` statements — no drops. Confirm the four issues columns and three companies columns are present.

- [ ] **Step 5: Run the migration against local DB**

```bash
pnpm db:migrate
```

Expected: `Migrations complete`

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/schema/issues.ts packages/db/src/schema/companies.ts packages/db/src/migrations/
git commit -m "feat(db): add linked tracker fields and worktree path to issues; add tracker config to companies"
```

---

## Task 2: Rename companies → workspaces (database migration)

**Files:**
- Create: `packages/db/src/migrations/0058_rename_companies_to_workspaces.sql` (written manually — drizzle-kit cannot detect a rename)

> **Why manual:** drizzle-kit interprets a table rename as DROP + CREATE. Writing the SQL by hand uses `ALTER TABLE ... RENAME` which preserves all data and FK constraints.

- [ ] **Step 1: Identify all tables with a `company_id` FK column**

Run:
```bash
grep -r "company_id" packages/db/src/schema/ --include="*.ts" -l
```

Expected output (approximately): `agents.ts`, `issues.ts`, `approvals.ts`, `projects.ts`, `goals.ts`, `routines.ts`, `labels.ts`, `activityLog`, `costEvents.ts`, etc. Note every file listed.

- [ ] **Step 2: Write the manual rename migration**

Create `packages/db/src/migrations/0058_rename_companies_to_workspaces.sql`:

```sql
-- Rename the main table
ALTER TABLE "companies" RENAME TO "workspaces";

-- Rename the primary key constraint (PostgreSQL keeps old name otherwise)
ALTER TABLE "workspaces" RENAME CONSTRAINT "companies_pkey" TO "workspaces_pkey";

-- Rename the unique index on issue_prefix
ALTER INDEX "companies_issue_prefix_idx" RENAME TO "workspaces_issue_prefix_idx";

-- Rename company_id columns to workspace_id in every dependent table
-- (run the list from step 1 and add each table here)
ALTER TABLE "agents" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "issues" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "approvals" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "projects" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "goals" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "labels" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "routines" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "activity_log" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "cost_events" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "finance_events" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "budget_policies" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "budget_incidents" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "company_memberships" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "company_secrets" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "company_secret_versions" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "company_logos" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "approval_comments" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "heartbeat_runs" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "agent_api_keys" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "execution_workspaces" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "agent_task_sessions" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "plugin_company_settings" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "company_skills" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "feedback_exports" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "feedback_votes" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "join_requests" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "invites" RENAME COLUMN "company_id" TO "workspace_id";
ALTER TABLE "principal_permission_grants" RENAME COLUMN "company_id" TO "workspace_id";
```

> After writing this, re-run the grep from step 1 and add any table you missed. Every `company_id` FK must be renamed.

- [ ] **Step 3: Register the migration with Drizzle**

Drizzle tracks migrations in `packages/db/src/migrations/meta/_journal.json`. Open that file and add an entry for `0058_rename_companies_to_workspaces` following the pattern of existing entries. The `tag` field is the filename without extension.

- [ ] **Step 4: Run the migration**

```bash
pnpm db:migrate
```

Expected: `Migrations complete` with no errors.

- [ ] **Step 5: Verify in psql or your DB client**

```sql
\dt workspaces
SELECT column_name FROM information_schema.columns WHERE table_name = 'issues' AND column_name = 'workspace_id';
```

Both should return results.

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/migrations/0058_rename_companies_to_workspaces.sql packages/db/src/migrations/meta/
git commit -m "feat(db): rename companies table to workspaces, rename company_id FKs to workspace_id"
```

---

## Task 3: Update Drizzle schema files to match renamed DB

**Files:**
- Rename: `packages/db/src/schema/companies.ts` → `packages/db/src/schema/workspaces.ts`
- Modify: `packages/db/src/schema/agents.ts`
- Modify: `packages/db/src/schema/issues.ts`
- Modify: `packages/db/src/schema/approvals.ts`
- Modify: all other schema files that import from `companies.ts`
- Modify: `packages/db/src/schema/index.ts`

- [ ] **Step 1: Rewrite companies.ts as workspaces.ts**

Create `packages/db/src/schema/workspaces.ts` with this content (remove budget columns, remove `description`, remove feedback sharing, keep essentials, add new columns):

```ts
import { pgTable, uuid, text, integer, timestamp, boolean, uniqueIndex, jsonb } from "drizzle-orm/pg-core";

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    issuePrefix: text("issue_prefix").notNull().default("PAP"),
    issueCounter: integer("issue_counter").notNull().default(0),
    requireBoardApprovalForNewAgents: boolean("require_board_approval_for_new_agents")
      .notNull()
      .default(false),
    brandColor: text("brand_color"),
    issueTrackerConfig: jsonb("issue_tracker_config").$type<Record<string, unknown>>(),
    repoPath: text("repo_path"),
    worktreesPath: text("worktrees_path"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    issuePrefixUniqueIdx: uniqueIndex("workspaces_issue_prefix_idx").on(table.issuePrefix),
  }),
);
```

- [ ] **Step 2: Update agents.ts — remove reportsTo and budget columns**

In `packages/db/src/schema/agents.ts`:

Replace:
```ts
import { companies } from "./companies.js";
```
With:
```ts
import { workspaces } from "./workspaces.js";
```

Replace:
```ts
companyId: uuid("company_id").notNull().references(() => companies.id),
```
With:
```ts
workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
```

Remove these fields entirely:
```ts
reportsTo: uuid("reports_to").references((): AnyPgColumn => agents.id),
budgetMonthlyCents: integer("budget_monthly_cents").notNull().default(0),
spentMonthlyCents: integer("spent_monthly_cents").notNull().default(0),
```

Update the index at the bottom:
```ts
(table) => ({
  workspaceStatusIdx: index("agents_workspace_status_idx").on(table.workspaceId, table.status),
}),
```

Remove the `AnyPgColumn` import if it's no longer used (check if `parentId` in issues.ts still needs it — it does, but agents.ts can remove it).

- [ ] **Step 3: Update issues.ts — rename companyId ref**

In `packages/db/src/schema/issues.ts`:

Replace:
```ts
import { companies } from "./companies.js";
```
With:
```ts
import { workspaces } from "./workspaces.js";
```

Replace:
```ts
companyId: uuid("company_id").notNull().references(() => companies.id),
```
With:
```ts
workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
```

Update all index definitions that reference `companyId` → `workspaceId` and rename the index names (e.g. `"issues_company_status_idx"` → `"issues_workspace_status_idx"`).

- [ ] **Step 4: Update approvals.ts**

In `packages/db/src/schema/approvals.ts`:

Replace the import and `companyId` column analogously to steps 2–3 above. Update the index name from `approvals_company_status_type_idx` to `approvals_workspace_status_type_idx`.

- [ ] **Step 5: Update all other schema files that import companies**

For each file that has `import { companies } from "./companies.js"`:

```bash
grep -r "from.*companies" packages/db/src/schema/ --include="*.ts" -l
```

In each: replace `import { companies } from "./companies.js"` with `import { workspaces } from "./workspaces.js"`, and replace `.references(() => companies.id)` with `.references(() => workspaces.id)`, and rename the column from `companyId`/`company_id` to `workspaceId`/`workspace_id`.

- [ ] **Step 6: Update schema/index.ts**

Replace:
```ts
export { companies } from "./companies.js";
```
With:
```ts
export { workspaces } from "./workspaces.js";
```

Delete `packages/db/src/schema/companies.ts`.

- [ ] **Step 7: Verify TypeScript compiles in the db package**

```bash
pnpm --filter @paperclipai/db typecheck
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add packages/db/src/schema/
git commit -m "feat(db): update Drizzle schema files for company→workspace rename"
```

---

## Task 4: Update shared types

**Files:**
- Modify: `packages/shared/src/types/approval.ts`
- Modify: `packages/shared/src/constants.ts`
- Modify: `packages/shared/src/types/` — any type named `Company` or with `companyId`

- [ ] **Step 1: Update ApprovalType constants**

In `packages/shared/src/constants.ts`, find the `APPROVAL_TYPES` array and replace it:

```ts
export const APPROVAL_TYPES = [
  "tracker_issue_proposal",
  "create_agent",
] as const;
export type ApprovalType = (typeof APPROVAL_TYPES)[number];
```

- [ ] **Step 2: Update Approval interface**

In `packages/shared/src/types/approval.ts`:

```ts
export interface Approval {
  id: string;
  workspaceId: string;
  type: ApprovalType;
  requestedByAgentId: string | null;
  requestedByUserId: string | null;
  status: ApprovalStatus;
  payload: Record<string, unknown>;
  decisionNote: string | null;
  decidedByUserId: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalComment {
  id: string;
  workspaceId: string;
  approvalId: string;
  authorAgentId: string | null;
  authorUserId: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 3: Find and rename Company type to Workspace**

```bash
grep -r "interface Company\|type Company\b" packages/shared/src/ --include="*.ts" -l
```

For each file found, rename `Company` → `Workspace` and `companyId` → `workspaceId` in the type definition. Also update the `index.ts` re-exports.

- [ ] **Step 4: Typecheck shared package**

```bash
pnpm --filter @paperclipai/shared typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/
git commit -m "feat(shared): rename Company→Workspace types, simplify ApprovalType"
```

---

## Task 5: Update server services

**Files:**
- Rename: `server/src/services/companies.ts` → `server/src/services/workspaces.ts`
- Modify: `server/src/services/approvals.ts`
- Delete: `server/src/services/hire-hook.ts`
- Modify: `server/src/services/index.ts`
- Modify: all other service files that reference `companyId` or import from `companies.ts`

- [ ] **Step 1: Rename and update companies.ts → workspaces.ts**

Copy `server/src/services/companies.ts` to `server/src/services/workspaces.ts`, then:
- Replace all imports of `companies` schema with `workspaces`
- Replace all `companyId` references with `workspaceId`
- Replace all `eq(companies.id, ...)` with `eq(workspaces.id, ...)`
- Rename exported functions: `companyService` → `workspaceService`, etc.
- Remove budget-related functions (any function that references `budgetMonthlyCents`, `spentMonthlyCents`)
- Remove any function that references org chart, CEO strategy, or hiring

Delete the original `server/src/services/companies.ts`.

- [ ] **Step 2: Delete hire-hook.ts**

```bash
rm server/src/services/hire-hook.ts
```

- [ ] **Step 3: Update approvals.ts — remove hire logic**

In `server/src/services/approvals.ts`, find and remove any function or code block that:
- References `hire_agent` approval type
- References `approve_ceo_strategy` approval type
- Imports from `hire-hook.ts`

- [ ] **Step 4: Update services/index.ts**

Replace:
```ts
export { companyService } from "./companies.js";
```
With:
```ts
export { workspaceService } from "./workspaces.js";
```

Remove any export for `hireHookService` or similar.

- [ ] **Step 5: Mass rename companyId in all other services**

```bash
grep -rl "companyId\|company_id\|companyService\|from.*companies" server/src/services/ --include="*.ts"
```

For each file listed: replace `companyId` → `workspaceId`, `companyService` → `workspaceService`, update imports. Use your editor's find-and-replace across files.

- [ ] **Step 6: Typecheck server**

```bash
pnpm --filter @paperclipai/server typecheck
```

Fix any remaining type errors. Expected: 0 errors after fixes.

- [ ] **Step 7: Commit**

```bash
git add server/src/services/
git commit -m "feat(server): rename company→workspace in services, remove hire-hook"
```

---

## Task 6: Update server routes

**Files:**
- Rename: `server/src/routes/companies.ts` → `server/src/routes/workspaces.ts`
- Delete: `server/src/routes/org-chart-svg.ts`
- Modify: `server/src/routes/index.ts`
- Modify: `server/src/routes/approvals.ts` — remove hire/strategy approval handling
- Modify: all other route files referencing `companyId`

- [ ] **Step 1: Rename companies.ts → workspaces.ts**

Copy to `server/src/routes/workspaces.ts`, then:
- Replace all `companyId` → `workspaceId`
- Replace route paths: every `/companies` → `/workspaces`, every `/companies/:companyId` → `/workspaces/:workspaceId`
- Replace `companyService` → `workspaceService`
- Remove any route handler for budget overrides
- Rename the exported function: `companyRoutes` → `workspaceRoutes`

Delete `server/src/routes/companies.ts`.

- [ ] **Step 2: Delete org-chart-svg.ts**

```bash
rm server/src/routes/org-chart-svg.ts
```

- [ ] **Step 3: Update routes/index.ts**

Replace:
```ts
import { companyRoutes } from "./companies.js";
```
With:
```ts
import { workspaceRoutes } from "./workspaces.js";
```

Replace all usages of `companyRoutes(...)` with `workspaceRoutes(...)`.

Remove any registration of `orgChartSvgRoutes`.

- [ ] **Step 4: Update approvals route — remove hire/strategy types**

In `server/src/routes/approvals.ts`, find any conditional logic that checks `approval.type === "hire_agent"` or `approval.type === "approve_ceo_strategy"` and remove those branches entirely.

- [ ] **Step 5: Mass rename in remaining route files**

```bash
grep -rl "companyId\|company_id\|companyRoutes\|from.*companies" server/src/routes/ --include="*.ts"
```

For each file: replace `companyId` → `workspaceId`. Pay attention to Express route params (`:companyId` → `:workspaceId`) and query strings (`?companyId=` → `?workspaceId=`).

- [ ] **Step 6: Typecheck server**

```bash
pnpm --filter @paperclipai/server typecheck
```

Expected: 0 errors.

- [ ] **Step 7: Run existing tests**

```bash
pnpm test:run
```

Expected: any test failures are due to renamed API paths — note them and fix by updating the test request paths.

- [ ] **Step 8: Commit**

```bash
git add server/src/routes/
git commit -m "feat(server): rename company→workspace in routes, remove org-chart route"
```

---

## Task 7: Emit issue.checkedout and issue.completed events

**Files:**
- Create: `server/src/services/issue-events.ts`
- Modify: `server/src/routes/issues.ts`

- [ ] **Step 1: Write the issue-events service**

Create `server/src/services/issue-events.ts`:

```ts
/**
 * Emits lifecycle events for issues that external systems (e.g. issue tracker adapters)
 * can subscribe to via the plugin event bus.
 */

import { pluginEventBus } from "./plugin-event-bus.js";

export interface IssueCheckedOutEvent {
  issueId: string;
  workspaceId: string;
  agentId: string;
  linkedExternalId: string | null;
  linkedBranchName: string | null;
  worktreePath: string | null;
}

export interface IssueCompletedEvent {
  issueId: string;
  workspaceId: string;
  agentId: string | null;
  linkedExternalId: string | null;
  linkedBranchName: string | null;
  worktreePath: string | null;
}

export function emitIssueCheckedOut(event: IssueCheckedOutEvent): void {
  pluginEventBus.emit("issue.checkedout", event);
}

export function emitIssueCompleted(event: IssueCompletedEvent): void {
  pluginEventBus.emit("issue.completed", event);
}
```

> **Note:** Check how `pluginEventBus.emit` is called in `server/src/services/plugin-event-bus.ts` first — match its exact signature. If it's async, make these functions async and await the emit.

- [ ] **Step 2: Write tests for the event emitter**

Create `server/src/__tests__/issue-events.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import * as pluginEventBusMod from "../services/plugin-event-bus.js";
import { emitIssueCheckedOut, emitIssueCompleted } from "../services/issue-events.js";

vi.mock("../services/plugin-event-bus.js", () => ({
  pluginEventBus: { emit: vi.fn() },
}));

describe("issue-events", () => {
  it("emitIssueCheckedOut emits issue.checkedout with correct payload", () => {
    const mockEmit = vi.spyOn(pluginEventBusMod.pluginEventBus, "emit");
    emitIssueCheckedOut({
      issueId: "issue-1",
      workspaceId: "ws-1",
      agentId: "agent-1",
      linkedExternalId: "LIN-123",
      linkedBranchName: "smith/LIN-123-fix-auth",
      worktreePath: null,
    });
    expect(mockEmit).toHaveBeenCalledWith("issue.checkedout", expect.objectContaining({
      issueId: "issue-1",
      linkedExternalId: "LIN-123",
    }));
  });

  it("emitIssueCompleted emits issue.completed with correct payload", () => {
    const mockEmit = vi.spyOn(pluginEventBusMod.pluginEventBus, "emit");
    emitIssueCompleted({
      issueId: "issue-2",
      workspaceId: "ws-1",
      agentId: "agent-1",
      linkedExternalId: "LIN-123",
      linkedBranchName: "smith/LIN-123-fix-auth",
      worktreePath: "/home/smith/projects/app-worktrees/smith/LIN-123-fix-auth",
    });
    expect(mockEmit).toHaveBeenCalledWith("issue.completed", expect.objectContaining({
      issueId: "issue-2",
      linkedBranchName: "smith/LIN-123-fix-auth",
    }));
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail correctly**

```bash
pnpm test:run -- server/src/__tests__/issue-events.test.ts
```

Expected: tests fail because `issue-events.ts` doesn't exist yet (or the mock path is wrong). Adjust mock paths if needed.

- [ ] **Step 4: Wire emitIssueCheckedOut into the checkout route**

In `server/src/routes/issues.ts`, find the checkout handler at approximately line 1938 (after the rename it will say `/issues/:id/checkout`).

After the line `res.json(updated);` (but before that — after the successful checkout), add:

```ts
import { emitIssueCheckedOut } from "../services/issue-events.js";

// Inside the checkout handler, after `const updated = await svc.checkout(...)`:
emitIssueCheckedOut({
  issueId: updated.id,
  workspaceId: updated.workspaceId,
  agentId: req.body.agentId,
  linkedExternalId: updated.linkedExternalId ?? null,
  linkedBranchName: updated.linkedBranchName ?? null,
  worktreePath: updated.worktreePath ?? null,
});
```

- [ ] **Step 5: Wire emitIssueCompleted into the issue update handler**

In `server/src/routes/issues.ts`, find the `PATCH /issues/:id` handler. After a status update that results in `done`, add:

```ts
import { emitIssueCompleted } from "../services/issue-events.js";

// After the patch is applied and if updated.status === "done":
if (updated.status === "done") {
  emitIssueCompleted({
    issueId: updated.id,
    workspaceId: updated.workspaceId,
    agentId: updated.assigneeAgentId ?? null,
    linkedExternalId: updated.linkedExternalId ?? null,
    linkedBranchName: updated.linkedBranchName ?? null,
    worktreePath: updated.worktreePath ?? null,
  });
}
```

- [ ] **Step 6: Run tests**

```bash
pnpm test:run -- server/src/__tests__/issue-events.test.ts
```

Expected: both tests pass.

- [ ] **Step 7: Commit**

```bash
git add server/src/services/issue-events.ts server/src/__tests__/issue-events.test.ts server/src/routes/issues.ts
git commit -m "feat(server): emit issue.checkedout and issue.completed events"
```

---

## Task 8: Git worktree creation on checkout

**Files:**
- Create: `server/src/services/worktree.ts`
- Modify: `server/src/routes/issues.ts`

- [ ] **Step 1: Write the worktree service**

Create `server/src/services/worktree.ts`:

```ts
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
```

- [ ] **Step 2: Write tests for the worktree service**

Create `server/src/services/worktree.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import * as childProcess from "node:child_process";
import * as fsPromises from "node:fs/promises";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));
vi.mock("node:fs/promises", () => ({
  access: vi.fn(),
  mkdir: vi.fn(),
}));

let createWorktree: typeof import("./worktree.js").createWorktree;
let removeWorktree: typeof import("./worktree.js").removeWorktree;

beforeAll(async () => {
  const mod = await import("./worktree.js");
  createWorktree = mod.createWorktree;
  removeWorktree = mod.removeWorktree;
});

describe("createWorktree", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns existing worktree path if directory already exists", async () => {
    vi.mocked(fsPromises.access).mockResolvedValueOnce(undefined);
    const result = await createWorktree("/repo", "/worktrees", "smith/LIN-1-fix");
    expect(result.worktreePath).toBe("/worktrees/smith/LIN-1-fix");
    expect(childProcess.execFile).not.toHaveBeenCalled();
  });

  it("creates new branch and worktree when branch does not exist", async () => {
    vi.mocked(fsPromises.access).mockRejectedValueOnce(new Error("ENOENT"));
    vi.mocked(fsPromises.mkdir).mockResolvedValueOnce(undefined);
    const mockExecFile = vi.mocked(childProcess.execFile);
    // rev-parse fails — branch doesn't exist
    mockExecFile.mockImplementationOnce((_cmd, _args, cb) => (cb as Function)(new Error("not found")));
    // worktree add -b succeeds
    mockExecFile.mockImplementationOnce((_cmd, _args, cb) => (cb as Function)(null, "", ""));
    const result = await createWorktree("/repo", "/worktrees", "smith/LIN-1-fix");
    expect(result.worktreePath).toBe("/worktrees/smith/LIN-1-fix");
    expect(mockExecFile).toHaveBeenCalledTimes(2);
  });
});

describe("removeWorktree", () => {
  it("calls git worktree remove with --force", async () => {
    const mockExecFile = vi.mocked(childProcess.execFile);
    mockExecFile.mockImplementationOnce((_cmd, _args, cb) => (cb as Function)(null, "", ""));
    await removeWorktree("/repo", "/worktrees/smith/LIN-1-fix");
    expect(mockExecFile).toHaveBeenCalledWith(
      "git",
      ["-C", "/repo", "worktree", "remove", "/worktrees/smith/LIN-1-fix", "--force"],
      expect.any(Function),
    );
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
pnpm test:run -- server/src/services/worktree.test.ts
```

Expected: test failures because `worktree.ts` does not exist yet (now add it via step 1).

- [ ] **Step 4: Run tests again after implementing**

```bash
pnpm test:run -- server/src/services/worktree.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Wire worktree creation into the checkout route**

In `server/src/routes/issues.ts`, inside the checkout handler, after `const updated = await svc.checkout(...)`:

```ts
import { createWorktree } from "../services/worktree.js";

// After successful checkout, create worktree if workspace has repoPath configured
// and the issue has a linkedBranchName
const workspace = await workspaceService(db).getById(updated.workspaceId);
if (workspace?.repoPath && updated.linkedBranchName) {
  const worktreesPath = workspace.worktreesPath ?? `${workspace.repoPath}-worktrees`;
  try {
    const { worktreePath } = await createWorktree(
      workspace.repoPath,
      worktreesPath,
      updated.linkedBranchName,
    );
    // Persist the worktree path on the issue
    await svc.update(updated.id, { worktreePath });
    updated.worktreePath = worktreePath;
  } catch (err) {
    // Log but don't fail the checkout — worktree failure is non-fatal
    logger.warn({ err, issueId: updated.id }, "failed to create worktree on checkout");
  }
}
```

- [ ] **Step 6: Add worktree removal API endpoint**

In `server/src/routes/issues.ts`, add a new route after the existing checkout/release routes:

```ts
import { removeWorktree } from "../services/worktree.js";

router.post("/issues/:id/worktree/remove", async (req, res) => {
  assertBoard(req);
  const id = req.params.id as string;
  const issue = await svc.getById(id);
  if (!issue) { res.status(404).json({ error: "Issue not found" }); return; }
  if (!issue.worktreePath) { res.status(400).json({ error: "Issue has no worktree" }); return; }

  const workspace = await workspaceService(db).getById(issue.workspaceId);
  if (!workspace?.repoPath) { res.status(400).json({ error: "Workspace has no repoPath configured" }); return; }

  await removeWorktree(workspace.repoPath, issue.worktreePath);
  await svc.update(id, { worktreePath: null });
  res.json({ ok: true });
});
```

- [ ] **Step 7: Typecheck**

```bash
pnpm --filter @paperclipai/server typecheck
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add server/src/services/worktree.ts server/src/services/worktree.test.ts server/src/routes/issues.ts
git commit -m "feat(server): git worktree isolation — create worktree on checkout, remove endpoint"
```

---

## Task 9: Update UI — rename Company → Workspace

**Files:**
- Rename: `ui/src/api/companies.ts` → `ui/src/api/workspaces.ts`
- Rename: `ui/src/pages/Companies.tsx` → `ui/src/pages/Workspaces.tsx`
- Rename: `ui/src/pages/CompanySettings.tsx` → `ui/src/pages/WorkspaceSettings.tsx`
- Delete: `ui/src/pages/OrgChart.tsx`, `ui/src/pages/Org.tsx`, `ui/src/pages/Goals.tsx`, `ui/src/pages/GoalDetail.tsx`, `ui/src/pages/Costs.tsx`, `ui/src/pages/CompanyExport.tsx`, `ui/src/pages/CompanyImport.tsx`
- Modify: `ui/src/context/CompanyContext.tsx` → `ui/src/context/WorkspaceContext.tsx`
- Modify: `ui/src/api/index.ts`

- [ ] **Step 1: Rename the API client**

Copy `ui/src/api/companies.ts` to `ui/src/api/workspaces.ts`. In the new file:
- Rename `companiesApi` → `workspacesApi`
- Replace all URL strings: `/companies` → `/workspaces`, `/companies/${companyId}` → `/workspaces/${workspaceId}`
- Replace all type references: `Company` → `Workspace`
- Update the parameter name `companyId` → `workspaceId` throughout

Delete `ui/src/api/companies.ts`.

- [ ] **Step 2: Rename CompanyContext → WorkspaceContext**

Copy `ui/src/context/CompanyContext.tsx` to `ui/src/context/WorkspaceContext.tsx`. In the new file:
- Rename `CompanyContext` → `WorkspaceContext`
- Rename `useCompany` hook → `useWorkspace`
- Rename `companies`/`selectedCompany`/`selectedCompanyId` → `workspaces`/`selectedWorkspace`/`selectedWorkspaceId`
- Replace `companiesApi` → `workspacesApi`

Delete `ui/src/context/CompanyContext.tsx`.

- [ ] **Step 3: Delete removed pages**

```bash
rm ui/src/pages/OrgChart.tsx ui/src/pages/Org.tsx ui/src/pages/Goals.tsx ui/src/pages/GoalDetail.tsx ui/src/pages/GoalDetail.test.tsx ui/src/pages/Costs.tsx ui/src/pages/CompanyExport.tsx ui/src/pages/CompanyImport.tsx ui/src/pages/CompanySkills.tsx
```

- [ ] **Step 4: Rename Companies.tsx → Workspaces.tsx**

Copy `ui/src/pages/Companies.tsx` to `ui/src/pages/Workspaces.tsx`. Replace all `Company`/`company`/`companyId` with `Workspace`/`workspace`/`workspaceId`. Replace `companiesApi` → `workspacesApi`. Replace `useCompany` → `useWorkspace`.

Delete `ui/src/pages/Companies.tsx`.

- [ ] **Step 5: Rename CompanySettings.tsx → WorkspaceSettings.tsx**

Same mechanical rename as step 4. Additionally, remove the budget section (any JSX that renders `budgetMonthlyCents` fields) and the feedback data sharing section. Keep name, brand color, issue prefix, and the `requireBoardApprovalForNewAgents` toggle (renamed to "Require approval for agent creation").

Delete `ui/src/pages/CompanySettings.tsx`.

- [ ] **Step 6: Mass rename useCompany → useWorkspace across all UI files**

```bash
grep -rl "useCompany\|companiesApi\|CompanyContext\|companyId\|selectedCompany" ui/src/ --include="*.tsx" --include="*.ts"
```

For each file listed: replace `useCompany` → `useWorkspace`, `companiesApi` → `workspacesApi`, `selectedCompanyId` → `selectedWorkspaceId`, `selectedCompany` → `selectedWorkspace`, `companyId` → `workspaceId`. Update imports accordingly.

- [ ] **Step 7: Update router to remove deleted pages and update routes**

Find the router configuration file (likely `ui/src/App.tsx` or `ui/src/routes.tsx`):

```bash
grep -rl "OrgChart\|Goals\|CompanySettings\|Companies\b" ui/src/ --include="*.tsx"
```

Remove route entries for deleted pages. Update routes for renamed pages:
- `/companies` → `/workspaces`
- `/companies/:companyId/settings` → `/workspaces/:workspaceId/settings`
- Remove `/org-chart`, `/goals`, `/costs`

- [ ] **Step 8: Update sidebar navigation**

Find the sidebar component:
```bash
grep -rl "OrgChart\|Goals.*nav\|Costs.*nav\|sidebar" ui/src/components/ --include="*.tsx" -l
```

Remove nav links to deleted pages. Update link hrefs for renamed pages.

- [ ] **Step 9: Update NewAgent.tsx and AgentDetail.tsx**

In both files:
- Remove the `reportsTo` field and any org chart hierarchy UI
- Remove `budgetMonthlyCents` field
- Replace `useCompany` → `useWorkspace`

- [ ] **Step 10: Typecheck UI**

```bash
pnpm --filter @paperclipai/ui typecheck
```

Fix all type errors. Expected: 0 errors.

- [ ] **Step 11: Commit**

```bash
git add ui/src/
git commit -m "feat(ui): rename Company→Workspace throughout, remove org chart and budget pages"
```

---

## Task 10: Add Issue Tracker and Repository settings to workspace UI

**Files:**
- Modify: `ui/src/pages/WorkspaceSettings.tsx`
- Modify: `ui/src/api/workspaces.ts`

- [ ] **Step 1: Add the tracker config update method to the API client**

In `ui/src/api/workspaces.ts`, add:

```ts
updateTrackerConfig: (
  workspaceId: string,
  config: { type: "linear"; apiKey: string; userId: string; teamId: string } | null,
) => api.patch<Workspace>(`/workspaces/${workspaceId}`, { issueTrackerConfig: config }),

updateRepoConfig: (
  workspaceId: string,
  config: { repoPath: string; worktreesPath?: string },
) => api.patch<Workspace>(`/workspaces/${workspaceId}`, config),
```

- [ ] **Step 2: Add Issue Tracker section to WorkspaceSettings.tsx**

In `ui/src/pages/WorkspaceSettings.tsx`, add a new section below the general settings:

```tsx
{/* Issue Tracker */}
<section>
  <h2 className="text-lg font-semibold mb-4">Issue Tracker</h2>
  <Field label="Tracker Type">
    <select
      value={trackerType}
      onChange={(e) => setTrackerType(e.target.value)}
      className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
    >
      <option value="">None</option>
      <option value="linear">Linear</option>
    </select>
  </Field>
  {trackerType === "linear" && (
    <>
      <Field label="Linear API Key">
        <input
          type="password"
          value={linearApiKey}
          onChange={(e) => setLinearApiKey(e.target.value)}
          placeholder="lin_api_..."
        />
      </Field>
      <Field label="Linear User ID">
        <input
          value={linearUserId}
          onChange={(e) => setLinearUserId(e.target.value)}
          placeholder="Your Linear user ID"
        />
      </Field>
      <Field label="Linear Team ID">
        <input
          value={linearTeamId}
          onChange={(e) => setLinearTeamId(e.target.value)}
          placeholder="Linear team ID"
        />
      </Field>
    </>
  )}
  <Button onClick={handleSaveTrackerConfig}>Save Tracker Settings</Button>
</section>
```

Wire the local state variables (`trackerType`, `linearApiKey`, `linearUserId`, `linearTeamId`) using `useState`, initialized from `selectedWorkspace.issueTrackerConfig`. The `handleSaveTrackerConfig` handler calls `workspacesApi.updateTrackerConfig(workspaceId, ...)` via a `useMutation`.

- [ ] **Step 3: Add Repository section to WorkspaceSettings.tsx**

Below the Issue Tracker section:

```tsx
{/* Repository */}
<section>
  <h2 className="text-lg font-semibold mb-4">Repository</h2>
  <Field label="Repository Path" hint="Absolute path to the git repository clone on this machine">
    <input
      value={repoPath}
      onChange={(e) => setRepoPath(e.target.value)}
      placeholder="/home/you/projects/myapp"
    />
  </Field>
  <Field label="Worktrees Path" hint="Where agent worktrees are created. Defaults to {repoPath}-worktrees">
    <input
      value={worktreesPath}
      onChange={(e) => setWorktreesPath(e.target.value)}
      placeholder="/home/you/projects/myapp-worktrees (optional)"
    />
  </Field>
  <Button onClick={handleSaveRepoConfig}>Save Repository Settings</Button>
</section>
```

Wire state and mutation analogously to step 2.

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @paperclipai/ui typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add ui/src/pages/WorkspaceSettings.tsx ui/src/api/workspaces.ts
git commit -m "feat(ui): add issue tracker and repository config sections to workspace settings"
```

---

## Task 11: Final integration check

- [ ] **Step 1: Run all tests**

```bash
pnpm test:run
```

Fix any remaining failures. Common sources: test files that still reference `companyId`, mock data that uses the old route paths, or imports from deleted files.

- [ ] **Step 2: Start the dev server and manually verify**

```bash
pnpm dev
```

Check:
- Navigating to `/workspaces` shows the workspace list
- Creating a workspace works
- Creating an agent (no `reportsTo` field visible, no budget field)
- Approvals page shows no `hire_agent` or `approve_ceo_strategy` entries
- Workspace settings has "Issue Tracker" and "Repository" sections
- OrgChart, Goals, Costs pages return 404 (routes removed)

- [ ] **Step 3: Final typecheck across all packages**

```bash
pnpm typecheck
```

Expected: 0 errors across all packages.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: final integration fixes for core retool"
```
