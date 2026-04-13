---
title: Paperclip Lite — Personal Orchestration Tool Retool + Issue Tracker Integration
summary: Retool Paperclip Lite from a multi-company AI workforce platform to a personal development orchestration tool, with a tracker-agnostic issue sync layer and Linear as the first adapter.
date: 2026-04-12
status: approved
---

## Overview

Paperclip Lite is being retooled from a multi-company AI workforce platform into a **personal development orchestration tool**. The operator (a single human) manages multiple workspaces, each containing specialized AI agents that autonomously work on issues synced from an external issue tracker. The operator is the sole decision-maker; there is no CEO, org chart, or hiring flow.

Two primary automation goals drive this retool:

1. **Active development automation** — agents self-select and work on issues assigned to the operator in an external tracker, creating branches and committing code autonomously
2. **Proactive security and code audits** — a scheduled audit agent inspects configured file paths, proposes issues for findings, and those issues enter the operator's approval queue before touching the external tracker

---

## What Changes vs. Current Paperclip

### Removed
- Company hierarchy (CEO, org chart, reporting structure)
- Agent hiring approval flow (`hire_agent` approval type)
- CEO strategy approval (`approve_ceo_strategy` approval type)
- Multi-user board membership
- Budget salary metaphors and token budget policies
- Goals hierarchy (projects are sufficient for organization)

### Renamed
- `company` → `workspace` throughout data model, API, and UI

### Kept
- Multiple workspaces per installation (operator manages all)
- Agents with capabilities descriptions and adapter configs
- Heartbeat protocol (schedule, assignment, comment, manual, approval resolution triggers)
- Issues — internal task tracking with atomic checkout
- Issue comments — primary channel for agent-to-agent communication and operator updates
- Approval queue — simplified to two types (see below)
- Activity audit log
- Projects
- Execution adapters (Claude Local, Codex, Process, HTTP)

### Added
- Issue tracker adapter system (tracker-agnostic sync layer)
- Linear adapter (first implementation)
- `linked_external_id` and `linked_external_url` nullable columns on `issues`
- `issue.checkedout` and `issue.completed` internal events
- Security audit routine concept
- Operator inbox notifications

---

## Data Model Changes

### `workspaces` table (renamed from `companies`)
Remove: `goal`, budget-related columns, org-chart columns.  
Keep: `id`, `name`, `slug`, `createdAt`, `updatedAt`.  
Add: `issueTrackerConfig` (JSONB, nullable) — see Issue Tracker Adapter section.

### `agents` table
Remove: `reportsTo`, `managerId`, hiring-related fields.  
Keep: all execution and identity fields.  
No structural hierarchy — agents are a flat list per workspace.

### `issues` table
Add:
- `linkedExternalId` (`text`, nullable) — ID in the external tracker
- `linkedExternalUrl` (`text`, nullable) — deep link to the external tracker issue

### New internal events (emitted by issues service, consumed by issue tracker adapter)
- `issue.checkedout` — fired when an agent successfully checks out an issue
- `issue.completed` — fired when an issue transitions to `done`

### Approval types (simplified)
- `tracker_issue_proposal` — agent proposes a new issue for the external tracker; operator approves/rejects before it is pushed
- `create_agent` — agent requests creation of a collaborator agent (optional; disabled by default, toggled in workspace settings under "Agent Permissions")
- All other existing approval types are removed

---

## Issue Tracker Adapter System

The issue tracker layer is **tracker-agnostic**. Each workspace configures one tracker adapter by type. The system ships with a `linear` adapter; future adapters (e.g. `github`, `jira`) follow the same interface.

### Adapter interface

```ts
interface IssueTrackerAdapter {
  /** Pull open issues assigned to the configured user. Returns normalized issues. */
  syncIssues(config: TrackerConfig): Promise<NormalizedIssue[]>

  /** Update the status of an external issue (e.g. "In Progress", "Done"). */
  updateIssueStatus(externalId: string, status: ExternalIssueStatus, config: TrackerConfig): Promise<void>

  /** Create a new issue in the external tracker. Returns the created issue's external ID and URL. */
  createIssue(proposal: IssueProposal, config: TrackerConfig): Promise<{ externalId: string; url: string }>

  /** Derive the branch name for an external issue following the tracker's naming convention. */
  getBranchName(externalId: string, title: string, config: TrackerConfig): string

  /** Validate an inbound webhook payload and return a normalized event. */
  receiveWebhook(payload: unknown, headers: Record<string, string>, config: TrackerConfig): TrackerWebhookEvent | null
}
```

### Workspace tracker config shape

```ts
type WorkspaceIssueTrackerConfig =
  | { type: "linear"; apiKey: string; userId: string; teamId: string }
  | { type: "github"; token: string; owner: string; repo: string; assignee: string }
  // future adapters follow the same discriminated union pattern
```

Config is stored encrypted in `workspaces.issueTrackerConfig`. API key / token values are stored as secret refs, resolved at runtime.

---

## Linear Adapter

### Config fields
- `apiKey` — Linear API key (secret ref)
- `userId` — Linear user ID; only issues assigned to this user are synced
- `teamId` — Linear team to pull from

### Sync job (`sync-issues`)
- Runs every 15 minutes per workspace that has a Linear config
- Queries Linear GraphQL API: open issues where `assignee.id = userId`
- For each issue not yet in Paperclip: creates a Paperclip issue with `linkedExternalId`, `linkedExternalUrl`, and writes a `plan` document containing the full Linear description and the pre-computed branch name
- For issues that have been cancelled or completed in Linear: transitions the mirrored Paperclip issue to `cancelled` or `done`

### Branch naming
Linear's convention: `{username}/{identifier}-{title-slug}`  
Example: `smith/lin-123-fix-auth-middleware`  
The branch name is pre-computed by the adapter and stored in the `plan` document at sync time so the agent has it without needing to call any tool.

### Event hooks
- `issue.checkedout` → adapter calls Linear API: transition issue to "In Progress" state
- `issue.completed` → adapter creates an operator inbox notification: *"Branch `smith/lin-123-fix-auth-middleware` is ready — push to GitHub when ready"*

### Webhook endpoint
`POST /api/workspaces/:workspaceId/tracker/webhook`  
Receives Linear webhooks. Handles: issue reassigned (remove from Paperclip if no longer assigned to user), issue cancelled, issue updated (sync title/description changes).

### Issue proposal (from audit agent)
Agent calls the `tracker:propose-issue` tool with title, description, and severity. The adapter creates a `tracker_issue_proposal` approval request. On operator approval, the adapter calls Linear to create the issue. The next sync run picks it up as a new Paperclip issue.

---

## Agent Self-Selection

Agents do not use explicit routing rules. When an agent wakes up:

1. It checks for directly assigned Paperclip issues first and works on those
2. If no assigned issues, it queries available unassigned synced issues
3. It reads its own capabilities description against the available issue list and decides whether any issue falls within its domain
4. If it claims one, it checks it out atomically; if another agent claims it first (409), it moves on

This means agent capabilities descriptions are the routing mechanism. An agent described as *"Performs security and code quality audits on authentication and middleware code"* will self-select security-related issues. A general dev agent picks up everything else.

The operator creates agents directly — no hiring flow, no approval needed for agent creation (unless `create_agent` approvals are enabled in workspace settings).

---

## Security Audit System

The audit agent is a standard Paperclip agent with:
- A capabilities description that names the files/directories to audit and the type of issues to look for
- A heartbeat schedule (e.g. every 24 hours, or every Monday at 09:00)
- Access to the `tracker:propose-issue` tool

When the audit agent runs, it:
1. Inspects configured file paths for security vulnerabilities, code smells, or architectural drift
2. For each significant finding, calls `tracker:propose-issue` with title, description, and severity
3. Minor findings (style issues, non-critical warnings) are recorded in the dedicated Audit Log (see below) rather than creating new proposals

The operator reviews proposals in the approval queue. Approved proposals are pushed to the external tracker and the sync loop picks them up as new issues for other agents to work on.

Audit file paths and schedule are configured per-agent in the agent's config (not in workspace settings), so multiple audit agents can cover different areas of the codebase with different schedules.

---

## Audit Log

The Audit Log is a dedicated first-class UI surface, accessible as a sidebar menu item in the workspace navigation. It is not modelled as a Paperclip issue — it is its own view backed by audit run records.

**What it shows:**
- Chronological list of audit runs (agent, timestamp, files scanned, duration)
- Per-run findings, grouped by severity: critical, warning, info
- For each finding: the source file, the finding description, and its disposition (proposed to tracker / approved / rejected / dismissed as minor)
- Links to any `tracker_issue_proposal` approvals that originated from that run

**Data model:**
Audit runs are stored in a new `audit_runs` table (workspace-scoped). Each run has many `audit_findings` rows. The audit agent writes findings via a new internal API endpoint rather than issue comments.

**Why a dedicated surface:**
Audit output is operational telemetry, not task work. Mixing it into the issues list or as comments on a synthetic issue would bury it. A dedicated menu item keeps the issues list clean and makes audit history easy to review at a glance.

---

## Agent Tools (Tracker-Agnostic)

Tools use generic names so agents are not aware of which tracker is configured:

| Tool | Description |
|------|-------------|
| `tracker:propose-issue` | Submit a draft issue proposal into the approval queue |
| `tracker:get-issue-context` | Fetch full issue details from the external tracker (comments, labels, linked PRs) |

Tools are namespaced `tracker:` and resolved at runtime to the workspace's configured adapter.

---

## Approval Queue

The approval queue is simplified to two types. All approvals are visible in the existing Paperclip approvals UI — no new UI surfaces needed.

### `tracker_issue_proposal`
Payload: `{ title, description, severity, sourceFile?, finding? }`  
Lifecycle: `pending → approved → (adapter creates issue) → sync picks it up`  
On rejection: agent receives notification via issue comment; finding is dismissed.

### `create_agent` (optional, disabled by default)
Payload: `{ name, capabilities, adapterType, adapterConfig }`  
Toggled in workspace settings under "Agent Permissions". When enabled, an agent may request a collaborator. Operator approves and the agent is created directly — no further hiring flow.

---

## Operator Experience

**Day-to-day:**
- Approval queue: audit findings waiting for sign-off before becoming real tracker issues
- Inbox: branch-ready notifications when an agent finishes work
- Issues list: see what every agent is currently working on
- Activity log: full audit trail of agent actions

**Setup per workspace:**
- Create workspace
- Configure issue tracker (type, API key, user ID, team)
- Create agents (name, capabilities description, adapter config, heartbeat schedule)
- Optionally create an audit agent with file paths in its capabilities and a recurring schedule

**No ongoing configuration required** once agents and tracker are set up. Agents self-select work from the sync queue.

---

## UI Changes

- "Company" renamed to "Workspace" everywhere
- Org chart page removed
- Hiring/strategy approval types removed from the approvals UI
- New workspace settings section: "Issue Tracker" — type selector + type-specific config fields (API key, user ID, team)
- Agent creation form simplified: remove `reportsTo`, remove budget fields
- Issue detail: new "Tracker" tab showing linked external issue, status, and branch name
- New sidebar menu item: "Audit Log" — dedicated view for audit run history and findings (see Audit Log section)

---

## Implementation Phases

**Phase 1 — Retool core**
- Rename company → workspace in schema, API routes, and UI
- Remove org chart, hiring, CEO strategy from schema, services, routes, and UI
- Add `linkedExternalId`, `linkedExternalUrl` to issues
- Emit `issue.checkedout` and `issue.completed` events from issues service
- Simplify approval types

**Phase 2 — Issue tracker adapter system**
- Define `IssueTrackerAdapter` interface
- Add tracker config to workspace settings (schema + UI)
- Wire adapter event hooks (checkedout → update status, completed → inbox notification)
- Implement sync job scheduler (per workspace)
- Implement webhook endpoint

**Phase 3 — Linear adapter**
- Implement `LinearAdapter` conforming to the interface
- Sync job: GraphQL query + Paperclip issue creation with plan document
- Branch name computation
- Event hooks: mark in progress, send inbox notification
- `tracker:propose-issue` tool + `linear_issue_proposal` approval type
- `tracker:get-issue-context` tool

**Phase 4 — Security audit agent support + Audit Log UI**
- Add `audit_runs` and `audit_findings` tables and internal API endpoint for agents to write findings
- Build Audit Log sidebar menu item and view (run history, per-run findings, disposition tracking)
- Verify audit agent can run on a recurring heartbeat schedule
- Verify `tracker:propose-issue` tool is available and approval flow works end-to-end
- Document audit agent setup for the operator
