---
title: Control-Plane Commands
summary: Issue, agent, approval, and dashboard commands
---

Client-side commands for managing issues, agents, approvals, and more.

## Issue Commands

```sh
# List issues
pnpm offwatchai issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm offwatchai issue get <issue-id-or-identifier>

# Create issue
pnpm offwatchai issue create --title "..." [--description "..."] [--status todo] [--priority high]

# Update issue
pnpm offwatchai issue update <issue-id> [--status in_progress] [--comment "..."]

# Add comment
pnpm offwatchai issue comment <issue-id> --body "..." [--reopen]

# Checkout task
pnpm offwatchai issue checkout <issue-id> --agent-id <agent-id>

# Release task
pnpm offwatchai issue release <issue-id>
```

## Company Commands

```sh
pnpm offwatchai company list
pnpm offwatchai company get <company-id>

# Export to portable folder package (writes manifest + markdown files)
pnpm offwatchai company export <company-id> --out ./exports/acme --include company,agents

# Preview import (no writes)
pnpm offwatchai company import \
  <owner>/<repo>/<path> \
  --target existing \
  --company-id <company-id> \
  --ref main \
  --collision rename \
  --dry-run

# Apply import
pnpm offwatchai company import \
  ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent Commands

```sh
pnpm offwatchai agent list
pnpm offwatchai agent get <agent-id>
```

## Approval Commands

```sh
# List approvals
pnpm offwatchai approval list [--status pending]

# Get approval
pnpm offwatchai approval get <approval-id>

# Create approval
pnpm offwatchai approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# Approve
pnpm offwatchai approval approve <approval-id> [--decision-note "..."]

# Reject
pnpm offwatchai approval reject <approval-id> [--decision-note "..."]

# Request revision
pnpm offwatchai approval request-revision <approval-id> [--decision-note "..."]

# Resubmit
pnpm offwatchai approval resubmit <approval-id> [--payload '{"..."}']

# Comment
pnpm offwatchai approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm offwatchai activity list [--agent-id <id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard

```sh
pnpm offwatchai dashboard get
```

## Heartbeat

```sh
pnpm offwatchai heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100]
```
