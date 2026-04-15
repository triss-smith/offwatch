import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setIssueEventsPluginBus,
  emitIssueCheckedOut,
  emitIssueCompleted,
} from "../services/issue-events.js";
import type { PluginEventBus } from "../services/plugin-event-bus.js";

function makeMockBus(): PluginEventBus {
  return {
    emit: vi.fn().mockResolvedValue({ errors: [] }),
    forPlugin: vi.fn(),
    clearPlugin: vi.fn(),
    subscriptionCount: vi.fn().mockReturnValue(0),
  };
}

describe("issue-events", () => {
  beforeEach(() => {
    // Reset bus to null between tests
    setIssueEventsPluginBus(null as unknown as PluginEventBus);
  });

  describe("emitIssueCheckedOut", () => {
    it("emits issue.checkedout with correct eventType and payload", async () => {
      const mockBus = makeMockBus();
      setIssueEventsPluginBus(mockBus);

      emitIssueCheckedOut({
        issueId: "issue-1",
        workspaceId: "ws-1",
        agentId: "agent-1",
        linkedExternalId: "LIN-123",
        linkedBranchName: "smith/LIN-123-fix-auth",
        worktreePath: null,
      });

      // Allow microtask queue to flush (void async emit)
      await Promise.resolve();

      expect(mockBus.emit).toHaveBeenCalledOnce();
      const [event] = vi.mocked(mockBus.emit).mock.calls[0];
      expect(event.eventType).toBe("issue.checkedout");
      expect(event.entityId).toBe("issue-1");
      expect(event.workspaceId).toBe("ws-1");
      expect((event.payload as Record<string, unknown>)["linkedExternalId"]).toBe("LIN-123");
    });

    it("does not throw when no bus is registered", () => {
      // bus is null — should silently no-op
      expect(() =>
        emitIssueCheckedOut({
          issueId: "issue-1",
          workspaceId: "ws-1",
          agentId: "agent-1",
          linkedExternalId: null,
          linkedBranchName: null,
          worktreePath: null,
        }),
      ).not.toThrow();
    });
  });

  describe("emitIssueCompleted", () => {
    it("emits issue.completed with correct eventType and payload", async () => {
      const mockBus = makeMockBus();
      setIssueEventsPluginBus(mockBus);

      emitIssueCompleted({
        issueId: "issue-2",
        workspaceId: "ws-1",
        agentId: "agent-1",
        linkedExternalId: "LIN-123",
        linkedBranchName: "smith/LIN-123-fix-auth",
        worktreePath: "/home/smith/projects/app-worktrees/smith/LIN-123-fix-auth",
      });

      await Promise.resolve();

      expect(mockBus.emit).toHaveBeenCalledOnce();
      const [event] = vi.mocked(mockBus.emit).mock.calls[0];
      expect(event.eventType).toBe("issue.completed");
      expect(event.entityId).toBe("issue-2");
      expect((event.payload as Record<string, unknown>)["linkedBranchName"]).toBe(
        "smith/LIN-123-fix-auth",
      );
    });

    it("does not throw when no bus is registered", () => {
      expect(() =>
        emitIssueCompleted({
          issueId: "issue-2",
          workspaceId: "ws-1",
          agentId: null,
          linkedExternalId: null,
          linkedBranchName: null,
          worktreePath: null,
        }),
      ).not.toThrow();
    });
  });
});
