# OffWatch

**Your issues. Your agents. They ship while you're off-watch.**

OffWatch is a self-hosted server that connects your issue tracker to a fleet of AI coding agents. Assign an issue in Linear — an agent checks it out, opens a branch, and commits. You review and merge.

No babysitting. No tab management. Work lands in your repo.

---

## How it works

| Step | What happens |
| ---- | ------------ |
| **01** | An issue is assigned to you in Linear |
| **02** | OffWatch syncs it and makes it available to your agents |
| **03** | An agent checks it out atomically, works the issue, and commits |
| **04** | You get a summary in the issue thread and review the PR |

Agents wake on a schedule and on events — new assignments, @-mentions, approval resolutions. When there's nothing to do, they sleep.

---

## Features

**Issue tracker sync** — Linear adapter included. Issues sync in, completions sync back. Tracker-agnostic by design; additional adapters can be added.

**Atomic checkout** — one agent per issue, enforced. No duplicate work, no conflicts.

**Bring your own agent** — Claude Code, Codex, Cursor, OpenClaw, any HTTP endpoint, any local process. If it can receive a heartbeat, it works.

**Heartbeat protocol** — agents wake on schedule or on trigger, do their work, and sleep. Token-efficient: incremental comment delivery means agents only read what's new since their last wake.

**Approval queue** — agents can propose issues to your tracker before creating them. You approve or reject from the OffWatch UI.

**Multiple workspaces** — one deployment, multiple codebases. Each workspace has its own agents, projects, and tracker config.

**Skills** — inject context and workflow instructions into agents at runtime. Share skills across agents.

**Plugins** — extend OffWatch with custom tracing, knowledge bases, queues, and more via the plugin SDK.

**Activity log** — every agent action is recorded. Full audit trail, always.

**Mobile-ready UI** — manage your agents from anywhere.

---

## OffWatch is right for you if

- You want issues from your tracker to become commits without manual intervention
- You run multiple AI coding agents and lose track of who is doing what
- You want agents running 24/7 but still want to review their work before it merges
- You want a persistent session layer so agents don't restart from scratch every time
- You're hitting large token bills and want a leaner heartbeat layer

## OffWatch is not right for you if

- You want a chatbot or prompt manager — agents have jobs, not chat windows
- You want a drag-and-drop workflow builder — OffWatch models agents working issues, not pipelines
- You have one agent — this is for fleets

---

## Quickstart

Open source. Self-hosted. No account required.

```bash
git clone https://github.com/triss-smith/offwatch.git
cd offwatch
pnpm install
pnpm dev
```

This starts the API server at `http://localhost:3100` with an embedded PostgreSQL database. No setup required.

> **Requirements:** Node.js 20+, pnpm 9.15+

---

## Configuration

On first run, create a workspace and configure your issue tracker:

1. Open `http://localhost:3100` and create a workspace
2. Go to **Settings → Issue Tracker** and connect Linear (API key + team)
3. Add an agent and point it at your adapter of choice
4. Assign an issue to yourself in Linear and watch it appear

---

## Development

```bash
pnpm dev              # Full dev (API + UI, watch mode)
pnpm dev:server       # Server only
pnpm build            # Build all
pnpm typecheck        # Type checking
pnpm test:run         # Run tests
pnpm db:generate      # Generate DB migration
pnpm db:migrate       # Apply migrations
```

---

## Roadmap

- ✅ Issue tracker adapter system (Linear)
- ✅ Atomic issue checkout
- ✅ Heartbeat context compaction
- ✅ Skills manager
- ✅ Scheduled routines
- ✅ Approval queue
- ✅ Plugin system
- ✅ Multiple workspaces
- ⚪ GitHub Issues adapter
- ⚪ Git worktree isolation per checkout
- ⚪ Security audit routine
- ⚪ Desktop app
- ⚪ Additional tracker adapters

---

## Contributing

Contributions welcome. Open an issue to discuss before sending large PRs.

---

## License

MIT &copy; 2026 OffWatch
