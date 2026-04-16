---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `offwatchai run`

One-command bootstrap and start:

```sh
pnpm offwatchai run
```

Does:

1. Auto-onboards if config is missing
2. Runs `offwatchai doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm offwatchai run --instance dev
```

## `offwatchai onboard`

Interactive first-time setup:

```sh
pnpm offwatchai onboard
```

If Offwatch is already configured, rerunning `onboard` keeps the existing config in place. Use `offwatchai configure` to change settings on an existing install.

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm offwatchai onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm offwatchai onboard --yes
```

On an existing install, `--yes` now preserves the current config and just starts Offwatch with that setup.

## `offwatchai doctor`

Health checks with optional auto-repair:

```sh
pnpm offwatchai doctor
pnpm offwatchai doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

## `offwatchai configure`

Update configuration sections:

```sh
pnpm offwatchai configure --section server
pnpm offwatchai configure --section secrets
pnpm offwatchai configure --section storage
```

## `offwatchai env`

Show resolved environment configuration:

```sh
pnpm offwatchai env
```

This now includes bind-oriented deployment settings such as `PAPERCLIP_BIND` and `PAPERCLIP_BIND_HOST` when configured.

## `offwatchai allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm offwatchai allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.offwatch/instances/default/config.json` |
| Database | `~/.offwatch/instances/default/db` |
| Logs | `~/.offwatch/instances/default/logs` |
| Storage | `~/.offwatch/instances/default/data/storage` |
| Secrets key | `~/.offwatch/instances/default/secrets/master.key` |

Override with:

```sh
PAPERCLIP_HOME=/custom/home PAPERCLIP_INSTANCE_ID=dev pnpm offwatchai run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm offwatchai run --data-dir ./tmp/offwatch-dev
pnpm offwatchai doctor --data-dir ./tmp/offwatch-dev
```
