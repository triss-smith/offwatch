-- Rename the main table
ALTER TABLE "companies" RENAME TO "workspaces";--> statement-breakpoint

-- Rename the primary key constraint
ALTER TABLE "workspaces" RENAME CONSTRAINT "companies_pkey" TO "workspaces_pkey";--> statement-breakpoint

-- Rename the unique index on issue_prefix
ALTER INDEX "companies_issue_prefix_idx" RENAME TO "workspaces_issue_prefix_idx";--> statement-breakpoint

-- Rename company_id columns to workspace_id in every dependent table
ALTER TABLE "activity_log" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "agents" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "agent_api_keys" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "agent_config_revisions" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "agent_runtime_state" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "agent_task_sessions" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "agent_wakeup_requests" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "approvals" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "approval_comments" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "assets" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "budget_incidents" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "budget_policies" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "cli_auth_challenges" RENAME COLUMN "requested_company_id" TO "requested_workspace_id";--> statement-breakpoint
ALTER TABLE "company_logos" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "company_memberships" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "company_secrets" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "company_skills" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "cost_events" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "documents" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "document_revisions" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "execution_workspaces" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "feedback_exports" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "feedback_votes" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "finance_events" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "goals" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "heartbeat_runs" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "heartbeat_run_events" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "inbox_dismissals" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "invites" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "issues" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "issue_approvals" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "issue_attachments" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "issue_comments" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "issue_documents" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "issue_execution_decisions" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "issue_inbox_archives" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "issue_labels" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "issue_read_states" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "issue_relations" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "issue_work_products" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "join_requests" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "labels" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "plugin_company_settings" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "principal_permission_grants" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "project_goals" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "project_workspaces" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "routines" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "routine_triggers" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "routine_runs" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "workspace_operations" RENAME COLUMN "company_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "workspace_runtime_services" RENAME COLUMN "company_id" TO "workspace_id";
