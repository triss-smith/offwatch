import type { LiveEventType } from "../constants.js";

export interface LiveEvent {
  id: number;
  workspaceId: string;
  type: LiveEventType;
  createdAt: string;
  payload: Record<string, unknown>;
}
