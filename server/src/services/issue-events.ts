/**
 * Emits lifecycle events for issues so external systems (e.g. issue tracker adapters)
 * can subscribe via the plugin event bus.
 */

import { randomUUID } from "node:crypto";
import type { PluginEvent } from "@paperclipai/plugin-sdk";
import type { PluginEventBus } from "./plugin-event-bus.js";

let _pluginEventBus: PluginEventBus | null = null;

export function setIssueEventsPluginBus(bus: PluginEventBus): void {
  _pluginEventBus = bus;
}

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
  const pluginEvent: PluginEvent = {
    eventId: randomUUID(),
    eventType: "issue.checkedout",
    occurredAt: new Date().toISOString(),
    actorId: event.agentId,
    actorType: "agent",
    entityId: event.issueId,
    entityType: "issue",
    workspaceId: event.workspaceId,
    payload: event,
  };
  void _pluginEventBus?.emit(pluginEvent).catch(() => {});
}

export function emitIssueCompleted(event: IssueCompletedEvent): void {
  const pluginEvent: PluginEvent = {
    eventId: randomUUID(),
    eventType: "issue.completed",
    occurredAt: new Date().toISOString(),
    actorId: event.agentId ?? undefined,
    actorType: "agent",
    entityId: event.issueId,
    entityType: "issue",
    workspaceId: event.workspaceId,
    payload: event,
  };
  void _pluginEventBus?.emit(pluginEvent).catch(() => {});
}
