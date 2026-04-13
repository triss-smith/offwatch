import type { InboxDismissal } from "@paperclipai/shared";
import { api } from "./client";

export const inboxDismissalsApi = {
  list: (workspaceId: string) => api.get<InboxDismissal[]>(`/workspaces/${workspaceId}/inbox-dismissals`),
  dismiss: (workspaceId: string, itemKey: string) =>
    api.post<InboxDismissal>(`/workspaces/${workspaceId}/inbox-dismissals`, { itemKey }),
};
