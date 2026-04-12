# Heartbeat Context Compaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce per-wake token cost ~88% by embedding recent comments into `heartbeat-context`, truncating large descriptions, and updating agents to pass `afterCommentId` so only new comments are returned on subsequent wakes.

**Architecture:** Three-layer change: (1) server route gains `afterCommentId` param, embeds up to 20 comments using the existing `listComments` service, and truncates descriptions at 8192 chars; (2) MCP tools expose the new param and default `listComments` to limit 50; (3) SKILL.md Step 6 is updated so agents use embedded comments and store `latestCommentId` in session memory.

**Tech Stack:** TypeScript, Express, Zod, Vitest/Supertest, Drizzle ORM (existing patterns throughout)

---

## File Map

| File | Change |
|------|--------|
| `server/src/routes/issues.ts` | Add constants; modify heartbeat-context route |
| `server/src/__tests__/issues-goal-context-routes.test.ts` | Add `listComments` mock; add 5 new test cases |
| `packages/mcp-server/src/tools.ts` | Add `afterCommentId` to heartbeat tool; default limit in listComments |
| `skills/paperclip/SKILL.md` | Replace Step 6 "Use comments incrementally" block |

---

## Task 1: Update heartbeat-context route to embed comments and truncate description

**Files:**
- Modify: `server/src/routes/issues.ts:65` (add constants)
- Modify: `server/src/routes/issues.ts:689-768` (route body)
- Test: `server/src/__tests__/issues-goal-context-routes.test.ts`

- [ ] **Step 1: Add `listComments` to the mock and beforeEach default**

In `server/src/__tests__/issues-goal-context-routes.test.ts`, update `mockIssueService` (line 7) and `beforeEach` (line 123):

```typescript
const mockIssueService = vi.hoisted(() => ({
  getById: vi.fn(),
  getAncestors: vi.fn(),
  getRelationSummaries: vi.fn(),
  findMentionedProjectIds: vi.fn(),
  getCommentCursor: vi.fn(),
  getComment: vi.fn(),
  listAttachments: vi.fn(),
  listComments: vi.fn(),   // add this line
}));
```

In `beforeEach`, add after the `mockIssueService.listAttachments.mockResolvedValue([])` line:

```typescript
mockIssueService.listComments.mockResolvedValue([]);
```

- [ ] **Step 2: Write the failing tests**

Append these tests inside the `describe("issue goal context routes")` block in `server/src/__tests__/issues-goal-context-routes.test.ts`:

```typescript
it("truncates description at 8192 chars and sets descriptionTruncated + descriptionLength", async () => {
  const longDescription = "x".repeat(10_000);
  mockIssueService.getById.mockResolvedValue({
    ...legacyProjectLinkedIssue,
    description: longDescription,
  });

  const res = await request(createApp()).get(
    "/api/issues/11111111-1111-4111-8111-111111111111/heartbeat-context",
  );

  expect(res.status).toBe(200);
  expect(res.body.issue.description).toHaveLength(8192);
  expect(res.body.issue.descriptionTruncated).toBe(true);
  expect(res.body.issue.descriptionLength).toBe(10_000);
});

it("does not set descriptionTruncated when description fits within 8192 chars", async () => {
  const res = await request(createApp()).get(
    "/api/issues/11111111-1111-4111-8111-111111111111/heartbeat-context",
  );

  expect(res.status).toBe(200);
  expect(res.body.issue.description).toBe(legacyProjectLinkedIssue.description);
  expect(res.body.issue.descriptionTruncated).toBe(false);
  expect(res.body.issue.descriptionLength).toBe(legacyProjectLinkedIssue.description.length);
});

it("embeds comments and sets hasMoreComments false when listComments returns ≤20", async () => {
  const comments = Array.from({ length: 5 }, (_, i) => ({
    id: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa${String(i).padStart(3, "0")}`,
    issueId: legacyProjectLinkedIssue.id,
    body: `Comment ${i}`,
    createdAt: new Date().toISOString(),
  }));
  mockIssueService.listComments.mockResolvedValue(comments);

  const res = await request(createApp()).get(
    "/api/issues/11111111-1111-4111-8111-111111111111/heartbeat-context",
  );

  expect(res.status).toBe(200);
  expect(res.body.comments).toHaveLength(5);
  expect(res.body.hasMoreComments).toBe(false);
});

it("caps embedded comments at 20 and sets hasMoreComments true when listComments returns 21", async () => {
  const comments = Array.from({ length: 21 }, (_, i) => ({
    id: `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb${String(i).padStart(3, "0")}`,
    issueId: legacyProjectLinkedIssue.id,
    body: `Comment ${i}`,
    createdAt: new Date().toISOString(),
  }));
  mockIssueService.listComments.mockResolvedValue(comments);

  const res = await request(createApp()).get(
    "/api/issues/11111111-1111-4111-8111-111111111111/heartbeat-context",
  );

  expect(res.status).toBe(200);
  expect(res.body.comments).toHaveLength(20);
  expect(res.body.hasMoreComments).toBe(true);
});

it("passes afterCommentId and order=asc to listComments when afterCommentId query param is set", async () => {
  const afterId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

  await request(createApp()).get(
    `/api/issues/11111111-1111-4111-8111-111111111111/heartbeat-context?afterCommentId=${afterId}`,
  );

  expect(mockIssueService.listComments).toHaveBeenCalledWith(
    legacyProjectLinkedIssue.id,
    expect.objectContaining({ afterCommentId: afterId, order: "asc" }),
  );
});
```

- [ ] **Step 3: Run the new tests to confirm they fail**

```bash
cd server && npx vitest run src/__tests__/issues-goal-context-routes.test.ts
```

Expected: the 5 new tests fail (listComments not called, description not truncated, comments not in response).

- [ ] **Step 4: Add constants near `MAX_ISSUE_COMMENT_LIMIT` in `server/src/routes/issues.ts`**

After line 65 (`const MAX_ISSUE_COMMENT_LIMIT = 500;`), add:

```typescript
const HEARTBEAT_CONTEXT_MAX_DESCRIPTION_CHARS = 8192;
const HEARTBEAT_CONTEXT_COLD_START_COMMENT_LIMIT = 20;
```

- [ ] **Step 5: Replace the heartbeat-context route body**

Replace lines 689–768 in `server/src/routes/issues.ts` with:

```typescript
  router.get("/issues/:id/heartbeat-context", async (req, res) => {
    const id = req.params.id as string;
    const issue = await svc.getById(id);
    if (!issue) {
      res.status(404).json({ error: "Issue not found" });
      return;
    }
    assertCompanyAccess(req, issue.companyId);

    const wakeCommentId =
      typeof req.query.wakeCommentId === "string" && req.query.wakeCommentId.trim().length > 0
        ? req.query.wakeCommentId.trim()
        : null;

    const afterCommentId =
      typeof req.query.afterCommentId === "string" && req.query.afterCommentId.trim().length > 0
        ? req.query.afterCommentId.trim()
        : null;

    const [{ project, goal }, ancestors, commentCursor, wakeComment, relations, attachments, rawComments] =
      await Promise.all([
        resolveIssueProjectAndGoal(issue),
        svc.getAncestors(issue.id),
        svc.getCommentCursor(issue.id),
        wakeCommentId ? svc.getComment(wakeCommentId) : null,
        svc.getRelationSummaries(issue.id),
        svc.listAttachments(issue.id),
        svc.listComments(issue.id, {
          afterCommentId,
          order: afterCommentId ? "asc" : "desc",
          limit: HEARTBEAT_CONTEXT_COLD_START_COMMENT_LIMIT + 1,
        }),
      ]);

    const hasMoreComments = rawComments.length > HEARTBEAT_CONTEXT_COLD_START_COMMENT_LIMIT;
    const comments = hasMoreComments
      ? rawComments.slice(0, HEARTBEAT_CONTEXT_COLD_START_COMMENT_LIMIT)
      : rawComments;

    const description = issue.description ?? null;
    const descriptionTruncated =
      description !== null && description.length > HEARTBEAT_CONTEXT_MAX_DESCRIPTION_CHARS;
    const truncatedDescription = descriptionTruncated
      ? description.slice(0, HEARTBEAT_CONTEXT_MAX_DESCRIPTION_CHARS)
      : description;

    res.json({
      issue: {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: truncatedDescription,
        descriptionTruncated,
        descriptionLength: description?.length ?? 0,
        status: issue.status,
        priority: issue.priority,
        projectId: issue.projectId,
        goalId: goal?.id ?? issue.goalId,
        parentId: issue.parentId,
        blockedBy: relations.blockedBy,
        blocks: relations.blocks,
        assigneeAgentId: issue.assigneeAgentId,
        assigneeUserId: issue.assigneeUserId,
        updatedAt: issue.updatedAt,
      },
      ancestors: ancestors.map((ancestor) => ({
        id: ancestor.id,
        identifier: ancestor.identifier,
        title: ancestor.title,
        status: ancestor.status,
        priority: ancestor.priority,
      })),
      project: project
        ? {
            id: project.id,
            name: project.name,
            status: project.status,
            targetDate: project.targetDate,
          }
        : null,
      goal: goal
        ? {
            id: goal.id,
            title: goal.title,
            status: goal.status,
            level: goal.level,
            parentId: goal.parentId,
          }
        : null,
      commentCursor,
      comments,
      hasMoreComments,
      wakeComment:
        wakeComment && wakeComment.issueId === issue.id
          ? wakeComment
          : null,
      attachments: attachments.map((a) => ({
        id: a.id,
        filename: a.originalFilename,
        contentType: a.contentType,
        byteSize: a.byteSize,
        contentPath: withContentPath(a).contentPath,
        createdAt: a.createdAt,
      })),
    });
  });
```

- [ ] **Step 6: Run all tests in the file to confirm they pass**

```bash
cd server && npx vitest run src/__tests__/issues-goal-context-routes.test.ts
```

Expected: all tests pass, including the 2 pre-existing heartbeat-context tests and the 5 new ones.

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/issues.ts server/src/__tests__/issues-goal-context-routes.test.ts
git commit -m "feat(api): embed comments and truncate description in heartbeat-context"
```

---

## Task 2: Update MCP tools

**Files:**
- Modify: `packages/mcp-server/src/tools.ts:177-198`

- [ ] **Step 1: Add `afterCommentId` to `paperclipGetHeartbeatContext`**

Replace the `paperclipGetHeartbeatContext` tool definition (lines 177–185) in `packages/mcp-server/src/tools.ts`:

```typescript
    makeTool(
      "paperclipGetHeartbeatContext",
      "Get compact heartbeat context for an issue. On the first wake omit afterCommentId to receive the 20 most recent comments embedded. On subsequent wakes pass afterCommentId=latestCommentId from the previous commentCursor to receive only new comments (zero tokens when nothing changed).",
      z.object({
        issueId: issueIdSchema,
        wakeCommentId: z.string().uuid().optional(),
        afterCommentId: z.string().uuid().optional(),
      }),
      async ({ issueId, wakeCommentId, afterCommentId }) => {
        const params = new URLSearchParams();
        if (wakeCommentId) params.set("wakeCommentId", wakeCommentId);
        if (afterCommentId) params.set("afterCommentId", afterCommentId);
        const qs = params.toString();
        return client.requestJson("GET", `/issues/${encodeURIComponent(issueId)}/heartbeat-context${qs ? `?${qs}` : ""}`);
      },
    ),
```

- [ ] **Step 2: Default `paperclipListComments` limit to 50**

Replace the `paperclipListComments` tool definition (lines 186–198) in `packages/mcp-server/src/tools.ts`:

```typescript
    makeTool(
      "paperclipListComments",
      "List issue comments with incremental options. Defaults to 50 most recent when no limit specified. Use after+order=asc to page forward through older history.",
      listCommentsSchema,
      async ({ issueId, after, order, limit }) => {
        const params = new URLSearchParams();
        if (after) params.set("after", after);
        if (order) params.set("order", order);
        params.set("limit", String(limit ?? 50));
        const qs = params.toString();
        return client.requestJson("GET", `/issues/${encodeURIComponent(issueId)}/comments${qs ? `?${qs}` : ""}`);
      },
    ),
```

- [ ] **Step 3: Type-check the package**

```bash
cd packages/mcp-server && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-server/src/tools.ts
git commit -m "feat(mcp): add afterCommentId to heartbeat context tool; default listComments limit to 50"
```

---

## Task 3: Update SKILL.md Step 6

**Files:**
- Modify: `skills/paperclip/SKILL.md:69-75`

- [ ] **Step 1: Replace the "Use comments incrementally" block**

In `skills/paperclip/SKILL.md`, replace lines 69–75 (the block starting with `Use comments incrementally:` through `Do not reflexively reload the whole thread on every heartbeat.`) with:

```markdown
Use comments incrementally:

- Call `paperclipGetHeartbeatContext` with `afterCommentId` set to the `latestCommentId` stored from your previous wake (saved in session memory). On the very first wake for a task, omit `afterCommentId`.
- The response includes a `comments` array with embedded comments and `hasMoreComments: boolean`. Use these directly — no separate `paperclipListComments` call needed for the normal case.
- Save `commentCursor.latestCommentId` to session memory at the end of each wake so you can pass it as `afterCommentId` next time.
- If `hasMoreComments: true` and you need older history, call `paperclipListComments` with `after=<oldest-embedded-comment-id>&order=asc` to page back.
- If `PAPERCLIP_WAKE_COMMENT_ID` is set and the wake comment is not already in the embedded `comments`, fetch it directly with `GET /api/issues/{issueId}/comments/{commentId}`.
- If `issue.descriptionTruncated` is true and you need the full description, fetch it with `paperclipGetIssue`. This is typically a one-time read per task — cache it in session memory.

Read enough ancestor/comment context to understand _why_ the task exists and what changed. Do not reflexively reload the whole thread on every heartbeat.
```

- [ ] **Step 2: Commit**

```bash
git add skills/paperclip/SKILL.md
git commit -m "feat(skill): use embedded heartbeat-context comments and afterCommentId for incremental wakes"
```
