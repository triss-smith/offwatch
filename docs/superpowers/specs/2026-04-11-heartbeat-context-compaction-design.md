# Heartbeat Context Compaction

**Date:** 2026-04-11
**Status:** Approved

## Problem

Fresh agents consume 20M+ tokens within 2 wakes. Root cause: `heartbeat-context` returns the full unbounded `issue.description` on every call, and agents cold-starting a session call `listComments` with no limit, dumping up to 500 full comment bodies at once. The pagination and cursor infrastructure already exists — it just isn't enforced or defaulted to safe values.

## Goal

Reduce per-wake token cost by ~88% across a session without losing any information. All content remains accessible; it just isn't front-loaded on every wake.

## Design

### 1. `GET /api/issues/:id/heartbeat-context`

**New query param:** `afterCommentId?: string (UUID)`

**Comment embedding:**
- When `afterCommentId` is provided: embed only comments newer than that ID (ascending order). If nothing is new, `comments: []`.
- When absent (cold start): embed the 20 most recent comments (descending).
- Add `hasMoreComments: boolean` — true when there are older comments beyond the embedded set.
- Existing `commentCursor` (totalComments, latestCommentId, latestCommentAt) stays unchanged.

**Description truncation:**
- Truncate `issue.description` at **8,192 chars**.
- When truncated, include `descriptionTruncated: true` and `descriptionLength: N` alongside the truncated text.
- Agents fetch the full description via `offwatchGetIssue` only when they need it (typically once per task).

**Response shape (additions):**
```ts
{
  issue: {
    // existing fields...
    description: string,          // truncated to 8192 chars
    descriptionTruncated: boolean, // true if truncated
    descriptionLength: number,    // full length in chars
  },
  comments: IssueComment[],      // embedded comments (new)
  hasMoreComments: boolean,      // new
  commentCursor: { ... },        // unchanged
  // ...rest unchanged
}
```

### 2. MCP Tool: `offwatchGetHeartbeatContext`

Add optional `afterCommentId: string` param, passed through to the endpoint as-is.

### 3. MCP Tool: `offwatchListComments`

- Add default limit of **50** when none is specified (server already enforces max 500).
- Add `hasMore: boolean` to the response.
- Used only for paging back through older history; not needed on typical wakes.

### 4. `skills/offwatch/SKILL.md` — Step 6

Replace the "use comments incrementally" block:

- On first wake (no prior session state): call `offwatchGetHeartbeatContext` without `afterCommentId`. Use the embedded comments from the response.
- On subsequent wakes: call `offwatchGetHeartbeatContext` with `afterCommentId` set to the `latestCommentId` stored from the previous wake. The response contains only new comments.
- Store `latestCommentId` from `commentCursor` in session memory at the end of each wake.
- Only call `offwatchListComments` explicitly when `hasMoreComments: true` and older history is required.
- Fetch full description via `offwatchGetIssue` only when `descriptionTruncated: true` and the full text is needed.

## Files Changed

| File | Change |
|------|--------|
| `server/src/routes/issues.ts` | Add `afterCommentId` param, embed comments, truncate description |
| `server/src/services/issues.ts` | Add `listRecentComments(issueId, limit)` helper |
| `packages/mcp-server/src/tools.ts` | Add `afterCommentId` to heartbeat tool; default limit + `hasMore` to listComments |
| `skills/offwatch/SKILL.md` | Update Step 6 to use embedded comments and `afterCommentId` pattern |

## Token Savings

Scenario: 3 active issues, 40 comments each (avg 800 chars), 4K char descriptions, 8 wakes per session.

| | Current | Option C |
|---|---|---|
| First wake | ~27K tokens | ~15K tokens |
| Each subsequent wake | ~27K tokens | ~1.5K tokens |
| Full session (8 wakes) | ~216K tokens | ~25K tokens |
| **Savings** | — | **~88%** |

## Constants

| Name | Value | Rationale |
|------|-------|-----------|
| `HEARTBEAT_CONTEXT_MAX_DESCRIPTION_CHARS` | 8,192 | ~2K tokens; covers most task descriptions |
| `HEARTBEAT_CONTEXT_COLD_START_COMMENT_LIMIT` | 20 | Covers recent thread without dumping full history |
| `LIST_COMMENTS_DEFAULT_LIMIT` | 50 | Safe default for explicit paging calls |
