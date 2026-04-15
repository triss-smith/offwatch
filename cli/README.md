<p align="center">
  <img src="https://raw.githubusercontent.com/triss-smith/offwatch/main/doc/assets/header.png" alt="Offwatch — automate dev work" width="720" />
</p>

<p align="center">
  <a href="#quickstart"><strong>Quickstart</strong></a> &middot;
  <a href="https://github.com/triss-smith/offwatch"><strong>GitHub</strong></a>
</p>

<p align="center">
  <a href="https://github.com/triss-smith/offwatch/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://github.com/triss-smith/offwatch/stargazers"><img src="https://img.shields.io/github/stars/triss-smith/offwatch?style=flat" alt="Stars" /></a>
</p>

<br/>

<div align="center">
  <video src="https://github.com/user-attachments/assets/773bdfb2-6d1e-4e30-8c5f-3487d5b70c8f" width="600" controls></video>
</div>

<br/>

## What is Offwatch?

# Open-source orchestration for AI agent teams

**If OpenClaw is an _employee_, Offwatch is the _team lead_**

Offwatch is a Node.js CLI that orchestrates a team of AI agents to automate dev work. Bring your own agents, assign tasks, and track their work from the command line.

**Manage development work, not pull requests.**

|        | Step            | Example                                                            |
| ------ | --------------- | ------------------------------------------------------------------ |
| **01** | Define the task | _"Build a REST API for user management."_                          |
| **02** | Hire the team   | Engineers, code reviewers, deployers — any bot, any provider.      |
| **03** | Approve and run | Review strategy. Set budgets. Hit go. Monitor from the CLI.         |

<br/>

<div align="center">
<table>
  <tr>
    <td align="center"><strong>Supports</strong></td>
    <td align="center"><img src="https://raw.githubusercontent.com/triss-smith/offwatch/main/doc/assets/logos/openclaw.svg" width="32" alt="OpenClaw" /><br/><sub>OpenClaw</sub></td>
    <td align="center"><img src="https://raw.githubusercontent.com/triss-smith/offwatch/main/doc/assets/logos/claude.svg" width="32" alt="Claude" /><br/><sub>Claude Code</sub></td>
    <td align="center"><img src="https://raw.githubusercontent.com/triss-smith/offwatch/main/doc/assets/logos/codex.svg" width="32" alt="Codex" /><br/><sub>Codex</sub></td>
    <td align="center"><img src="https://raw.githubusercontent.com/triss-smith/offwatch/main/doc/assets/logos/cursor.svg" width="32" alt="Cursor" /><br/><sub>Cursor</sub></td>
    <td align="center"><img src="https://raw.githubusercontent.com/triss-smith/offwatch/main/doc/assets/logos/bash.svg" width="32" alt="Bash" /><br/><sub>Bash</sub></td>
    <td align="center"><img src="https://raw.githubusercontent.com/triss-smith/offwatch/main/doc/assets/logos/http.svg" width="32" alt="HTTP" /><br/><sub>HTTP</sub></td>
  </tr>
</table>

<em>If it can receive a heartbeat, it's hired.</em>

</div>

<br/>

## Offwatch is right for you if

- ✅ You want to **automate development work** with AI agents
- ✅ You **coordinate many different agents** (OpenClaw, Codex, Claude, Cursor) toward a common goal
- ✅ You have **multiple AI agent terminals** open and lose track of what everyone is doing
- ✅ You want agents running **autonomously**, but still want to audit work and chime in when needed
- ✅ You want **persistent task tracking** across reboots
- ✅ You want a process for managing agents that **feels like using a task manager**

<br/>

## Features

<table>
<tr>
<td align="center" width="33%">
<h3>🔌 Bring Your Own Agent</h3>
Any agent, any runtime, one team. If it can receive a heartbeat, it's hired.
</td>
<td align="center" width="33%">
<h3>🎯 Task Management</h3>
Every task traces back to the project goal. Agents know <em>what</em> to do and <em>why</em>.
</td>
<td align="center" width="33%">
<h3>💓 Heartbeats</h3>
Agents wake on a schedule, check work, and act. Delegation flows up and down.
</td>
</tr>
<tr>
<td align="center">
<h3>💰 Cost Control</h3>
Monthly budgets per agent. When they hit the limit, they stop. No runaway costs.
</td>
<td align="center">
<h3>🏢 Multi-Workspace</h3>
One deployment, many workspaces. Complete data isolation.
</td>
<td align="center">
<h3>🎫 Ticket System</h3>
Every conversation traced. Every decision explained. Full tool-call tracing and audit log.
</td>
</tr>
<tr>
<td align="center">
<h3>🛡️ Governance</h3>
You're the lead. Approve work, override strategy, pause or terminate any agent — at any time.
</td>
<td align="center">
<h3>📊 Project Tracking</h3>
Tasks, progress, status. Your agents have work to do, with clear reporting.
</td>
<td align="center">
<h3>🔄 Persistent Sessions</h3>
Agents resume the same task context across heartbeats instead of restarting from scratch.
</td>
</tr>
</table>

<br/>

## Problems Offwatch solves

| Without Offwatch                                                                                                                     | With Offwatch                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| ❌ You have 20 AI agent tabs open and can't track which one does what. On reboot you lose everything.                                | ✅ Tasks are ticket-based, conversations are threaded, sessions persist across reboots.                                                |
| ❌ You manually gather context from several places to remind your bot what you're actually doing.                                   | ✅ Context flows from the task up through the project — your agent always knows what to do and why.                                  |
| ❌ Folders of agent configs are disorganized and you're re-inventing task management and coordination.                              | ✅ Offwatch gives you task management, ticketing, delegation, and governance out of the box.                                          |
| ❌ Runaway loops waste hundreds of dollars of tokens and max your quota before you even know what happened.                          | ✅ Cost tracking surfaces token budgets and throttles agents when they're out.                                                       |
| ❌ You have recurring jobs (maintenance, reports, deployments) and have to remember to manually kick them off.                      | ✅ Heartbeats handle regular work on a schedule.                                                                                      |
| ❌ You have an idea, you have to find your repo, fire up Claude Code, keep a tab open, and babysit it.                               | ✅ Add a task in Offwatch. Your coding agent works on it until it's done.                                                            |

<br/>

## Quickstart

```bash
npm install -g offwatch
offwatch --help
```

Or run directly:

```bash
npx offwatch --help
```

<br/>

## CLI Commands

```bash
offwatch worktree create     # Create a new isolated worktree for agent tasks
offwatch worktree list       # List all worktrees
offwatch worktree sync       # Sync issues to worktree
```

<br/>

## Development

```bash
pnpm install
pnpm build
pnpm dev
```

<br/>

## License

MIT &copy; 2026 Offwatch

<br/>

---

<p align="center">
  <sub>Open source under MIT. Built for developers who want to automate work, not babysit agents.</sub>
</p>
