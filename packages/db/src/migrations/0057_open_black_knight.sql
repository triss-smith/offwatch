ALTER TABLE "companies" ADD COLUMN "issue_tracker_config" jsonb;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "repo_path" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "worktrees_path" text;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "linked_external_id" text;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "linked_external_url" text;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "linked_branch_name" text;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "worktree_path" text;