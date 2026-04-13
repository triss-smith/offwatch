import type { SidebarBadges } from "@paperclipai/shared";
import { api } from "./client";

export const sidebarBadgesApi = {
  get: (workspaceId: string) => api.get<SidebarBadges>(`/workspaces/${workspaceId}/sidebar-badges`),
};
