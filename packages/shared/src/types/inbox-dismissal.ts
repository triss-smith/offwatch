export interface InboxDismissal {
  id: string;
  workspaceId: string;
  userId: string;
  itemKey: string;
  dismissedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
