# Rename offwatch to offwatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename all remaining `offwatch` references to `offwatch` throughout the codebase — CLI text, banners, env vars, config directories, server strings, UI strings, docs, and comments.

**Architecture:** Bulk find-replace across CLI, server, UI, docs, scripts, and config files. The ASCII art banner and tagline are creative decisions handled directly by the assistant. The `.offwatch` config directory is renamed to `.offwatch`.

**Tech Stack:** TypeScript, Node.js, pnpm monorepo

---

## File Structure Map

**CLI source files (52 files):**
- `cli/src/index.ts` — program name, description
- `cli/src/utils/banner.ts` — ASCII art, tagline, banner function
- `cli/src/config/home.ts` — `.offwatch` dir, `PAPERCLIP_HOME`, `PAPERCLIP_INSTANCE_ID`
- `cli/src/config/env.ts` — `PAPERCLIP_AGENT_JWT_SECRET`, env file comments
- `cli/src/config/store.ts` — `PAPERCLIP_*` config keys
- `cli/src/config/secrets-key.ts` — `PAPERCLIP_*` secrets keys
- `cli/src/config/data-dir.ts` — `PAPERCLIP_DATA_DIR`
- `cli/src/commands/*.ts` — offwatch in help text, banners, error messages
- `cli/src/checks/*.ts` — offwatch in check descriptions
- `cli/src/prompts/*.ts` — offwatch in prompts
- `cli/src/client/*.ts` — offwatch in client code
- `cli/src/__tests__/*.ts` — offwatch in test strings

**Server source files (101 files):**
- `server/src/startup-banner.ts` — ASCII art, offwatch references
- `server/src/ui-branding.ts` — `PAPERCLIP_*` env vars, meta tags, comments
- `server/src/home-paths.ts` — offwatch paths
- `server/src/paths.ts` — offwatch paths
- `server/src/index.ts` — offwatch strings
- `server/src/config.ts` — `PAPERCLIP_*` env vars
- `server/src/auth/*.ts` — offwatch in auth
- `server/src/routes/*.ts` — offwatch in routes
- `server/src/services/*.ts` — offwatch in services
- `server/src/middleware/*.ts` — offwatch in middleware
- `server/src/adapters/**/*.ts` — offwatch in adapters
- `server/src/__tests__/*.ts` — offwatch in tests

**UI source files (56 files):**
- `ui/src/App.tsx` — offwatch references
- `ui/src/pages/*.tsx` — offwatch in page titles/text
- `ui/src/components/*.tsx` — offwatch in components
- `ui/src/context/*.tsx` — offwatch in context
- `ui/src/api/*.ts` — offwatch in API
- `ui/src/lib/*.ts` — offwatch in lib

**Other files:**
- `packages/adapter-*/src/**/*.ts` — PAPERCLIP_ env vars in adapters
- `packages/db/src/runtime-config.ts` — PAPERCLIP_ env vars
- `packages/shared/src/**/*.ts` — PAPERCLIP_ env vars
- `docs/**/*.md` — offwatch in docs
- `scripts/**/*.sh`, `scripts/**/*.ts` — offwatch in scripts
- `skills/offwatch*/**/*.md` — skill documentation
- `docker/**/*` — offwatch in docker files

---

## Task 1: Update ASCII Art Banner and Tagline

**Files:**
- Modify: `cli/src/utils/banner.ts`

- [ ] **Step 1: Replace PAPERCLIP_ART with OFFWATCH_ART**

Replace the existing ASCII art with new "OffWatch" art:

```typescript
const OFFWATCH_ART = [
  "██╗    ██╗███████╗██████╗  ██████╗██╗   ██╗██████╗ ████████╗███████╗██████╗ ",
  "██║    ██║██╔════╝██╔══██╗██╔════╝██║   ██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗",
  "██║ █╗ ██║█████╗  ██████╔╝██║     ██║   ██║██████╔╝   ██║   █████╗  ██║  ██║",
  "██║███╗██║██╔══╝  ██╔══██╗██║     ██║   ██║██╔═══╝    ██║   ██╔══╝  ██║  ██║",
  "╚███╔███╔╝███████╗██████╔╝╚██████╗╚██████╔╝██║        ██║   ███████╗██████╔╝",
  " ╚══╝╚══╝ ╚══════╝╚═════╝  ╚═════╝ ╚═════╝ ╚═╝        ╚═╝   ╚══════╝╚═════╝ ",
] as const;
```

- [ ] **Step 2: Replace TAGLINE**

```typescript
const TAGLINE = "Orchestrate AI agent teams to automate your dev work";
```

- [ ] **Step 3: Rename function printOffwatchCliBanner → printOffwatchCliBanner**

```typescript
export function printOffwatchCliBanner(): void {
  const lines = [
    "",
    ...OFFWATCH_ART.map((line) => pc.cyan(line)),
    pc.blue("  ───────────────────────────────────────────────────────"),
    pc.bold(pc.white(`  ${TAGLINE}`)),
    "",
  ];

  console.log(lines.join("\n"));
}
```

- [ ] **Step 4: Commit**

```bash
cd C:/Users/smith/ww/offwatch
git add cli/src/utils/banner.ts
git commit -m "refactor: rename PAPERCLIP_ART to OFFWATCH_ART and update tagline"
```

---

## Task 2: Update CLI Program Name and Description

**Files:**
- Modify: `cli/src/index.ts`

- [ ] **Step 1: Update program name, description, and help text**

Replace:
```typescript
const DATA_DIR_OPTION_HELP =
  "Offwatch data directory root (isolates state from ~/.offwatch)";

program
  .name("offwatchai")
  .description("Offwatch CLI — setup, diagnose, and configure your instance")
```

With:
```typescript
const DATA_DIR_OPTION_HELP =
  "Offwatch data directory root (isolates state from ~/.offwatch)";

program
  .name("offwatch")
  .description("Offwatch CLI — setup, diagnose, and configure your instance")
```

- [ ] **Step 2: Update all "Offwatch" references in command descriptions**

Replace all instances of "Offwatch" (capital P) with "Offwatch" in command descriptions like:
- `option("--run", "Start Offwatch immediately after saving config")` → "Start Offwatch immediately..."
- `.description("Run diagnostic checks on your Offwatch setup")` → "Run diagnostic checks on your Offwatch setup"
- `.description("Bootstrap local setup (onboard + doctor) and run Offwatch")` → "Bootstrap local setup...and run Offwatch"
- `--filename-prefix` default "offwatch" → "offwatch"
- `--api-base` option description mentions "Offwatch server API" → "Offwatch server API"

- [ ] **Step 3: Update all offwatchai references**

Replace `offwatchai` with `offwatch` in all option descriptions and help text.

- [ ] **Step 4: Commit**

```bash
git add cli/src/index.ts
git commit -m "refactor: rename offwatchai to offwatch in CLI program"
```

---

## Task 3: Rename CLI Config Directory and Env Vars (home.ts, env.ts)

**Files:**
- Modify: `cli/src/config/home.ts`
- Modify: `cli/src/config/env.ts`
- Modify: `cli/src/config/store.ts`
- Modify: `cli/src/config/secrets-key.ts`
- Modify: `cli/src/config/data-dir.ts`

- [ ] **Step 1: Update home.ts — .offwatch → .offwatch, PAPERCLIP_* → OFFWATCH_***

Replace function and variable names:
- `resolveOffwatchHomeDir()` → `resolveOffwatchHomeDir()`
- `resolveOffwatchInstanceId()` → `resolveOffwatchInstanceId()`
- `resolveOffwatchInstanceRoot()` → `resolveOffwatchInstanceRoot()`
- `describeLocalInstancePaths()` stays same (describes the paths, not the product)
- Env var `PAPERCLIP_HOME` → `OFFWATCH_HOME`
- Env var `PAPERCLIP_INSTANCE_ID` → `OFFWATCH_INSTANCE_ID`
- Default dir `".offwatch"` → `".offwatch"`

```typescript
export function resolveOffwatchHomeDir(): string {
  const envHome = process.env.OFFWATCH_HOME?.trim();
  if (envHome) return path.resolve(expandHomePrefix(envHome));
  return path.resolve(os.homedir(), ".offwatch");
}

export function resolveOffwatchInstanceId(override?: string): string {
  const raw = override?.trim() || process.env.OFFWATCH_INSTANCE_ID?.trim() || DEFAULT_INSTANCE_ID;
  // ... rest unchanged
}
```

- [ ] **Step 2: Update env.ts — PAPERCLIP_AGENT_JWT_SECRET → OFFWATCH_AGENT_JWT_SECRET**

Replace:
- `const JWT_SECRET_ENV_KEY = "PAPERCLIP_AGENT_JWT_SECRET"` → `"OFFWATCH_AGENT_JWT_SECRET"`
- `"# Offwatch environment variables"` → `"# Offwatch environment variables"`
- `"# Generated by Offwatch CLI commands"` → `"# Generated by Offwatch CLI commands"`
- Function `loadOffwatchEnvFile` → `loadOffwatchEnvFile`
- Function `resolveOffwatchEnvFile` → `resolveOffwatchEnvFile`
- Function `readOffwatchEnvEntries` → `readOffwatchEnvEntries`
- Function `writeOffwatchEnvEntries` → `writeOffwatchEnvEntries`
- Function `mergeOffwatchEnvEntries` → `mergeOffwatchEnvEntries`

- [ ] **Step 3: Update store.ts — PAPERCLIP_CONFIG_DIR → OFFWATCH_CONFIG_DIR**

Search for PAPERCLIP_ in store.ts and replace.

- [ ] **Step 4: Update secrets-key.ts — PAPERCLIP_* → OFFWATCH_***

Search for PAPERCLIP_ in secrets-key.ts and replace.

- [ ] **Step 5: Update data-dir.ts — PAPERCLIP_DATA_DIR → OFFWATCH_DATA_DIR**

Search for PAPERCLIP_ in data-dir.ts and replace.

- [ ] **Step 6: Commit**

```bash
git add cli/src/config/home.ts cli/src/config/env.ts cli/src/config/store.ts cli/src/config/secrets-key.ts cli/src/config/data-dir.ts
git commit -m "refactor: rename PAPERCLIP_* to OFFWATCH_* env vars and .offwatch to .offwatch dir"
```

---

## Task 4: Bulk Rename in CLI Commands and Checks

**Files:**
- Modify: `cli/src/commands/onboard.ts`
- Modify: `cli/src/commands/doctor.ts`
- Modify: `cli/src/commands/configure.ts`
- Modify: `cli/src/commands/run.ts`
- Modify: `cli/src/commands/env.ts`
- Modify: `cli/src/commands/worktree.ts`
- Modify: `cli/src/commands/worktree-lib.ts`
- Modify: `cli/src/commands/db-backup.ts`
- Modify: `cli/src/commands/routines.ts`
- Modify: `cli/src/commands/auth-bootstrap-ceo.ts`
- Modify: `cli/src/commands/allowed-hostname.ts`
- Modify: `cli/src/commands/heartbeat-run.ts`
- Modify: `cli/src/commands/client/*.ts`
- Modify: `cli/src/checks/*.ts`
- Modify: `cli/src/prompts/*.ts`

- [ ] **Step 1: Bulk replace offwatch → offwatch in CLI source**

```bash
cd C:/Users/smith/ww/offwatch/cli/src
grep -rl "offwatch" --include="*.ts" . | xargs sed -i 's/offwatch/offwatch/g'
```

- [ ] **Step 2: Also replace Offwatch (capital P) → Offwatch**

```bash
cd C:/Users/smith/ww/offwatch/cli/src
grep -rl "Offwatch" --include="*.ts" . | xargs sed -i 's/Offwatch/Offwatch/g'
```

- [ ] **Step 3: Fix function renames that were incorrectly applied**

Some function names like `printOffwatchCliBanner` should become `printOffwatchCliBanner`. Fix any that were missed:

```bash
cd C:/Users/smith/ww/offwatch/cli/src
grep -rl "printOffwatchCliBanner" --include="*.ts" . | xargs sed -i 's/printOffwatchCliBanner/printOffwatchCliBanner/g'
```

- [ ] **Step 4: Verify no offwatch references remain**

```bash
grep -r "offwatch" C:/Users/smith/ww/offwatch/cli/src/ --include="*.ts" | grep -v node_modules | head -20
```

Expected: test fixture data or intentionally external references only.

- [ ] **Step 5: Commit**

```bash
git add cli/src
git commit -m "refactor: rename offwatch to offwatch in CLI commands and checks"
```

---

## Task 5: Bulk Rename in CLI Tests

**Files:**
- Modify: `cli/src/__tests__/*.ts`

- [ ] **Step 1: Bulk replace offwatch → offwatch in CLI test files**

```bash
cd C:/Users/smith/ww/offwatch/cli/src/__tests__
grep -rl "offwatch" --include="*.ts" . | xargs sed -i 's/offwatch/offwatch/g'
grep -rl "Offwatch" --include="*.ts" . | xargs sed -i 's/Offwatch/Offwatch/g'
```

- [ ] **Step 2: Verify no offwatch references remain**

```bash
grep -r "offwatch" C:/Users/smith/ww/offwatch/cli/src/__tests__/ --include="*.ts" | head -10
```

- [ ] **Step 3: Commit**

```bash
git add cli/src/__tests__
git commit -m "refactor: rename offwatch to offwatch in CLI tests"
```

---

## Task 6: Bulk Rename in Server Source

**Files:**
- Modify: `server/src/startup-banner.ts`
- Modify: `server/src/ui-branding.ts`
- Modify: `server/src/home-paths.ts`
- Modify: `server/src/paths.ts`
- Modify: `server/src/index.ts`
- Modify: `server/src/config.ts`
- Modify: `server/src/auth/*.ts`
- Modify: `server/src/routes/*.ts`
- Modify: `server/src/services/*.ts`
- Modify: `server/src/middleware/*.ts`
- Modify: `server/src/adapters/**/*.ts`
- Modify: `server/src/__tests__/*.ts`

- [ ] **Step 1: Update startup-banner.ts — ASCII art and offwatch references**

Replace the ASCII art in the server banner with OFFWATCH art. Also:
- `PAPERCLIP_HOME` → `OFFWATCH_HOME`
- `PAPERCLIP_INSTANCE_ID` → `OFFWATCH_INSTANCE_ID`
- `PAPERCLIP_AGENT_JWT_SECRET` → `OFFWATCH_AGENT_JWT_SECRET`
- `offwatchai onboard` → `offwatch onboard`
- Comments containing "Offwatch" → "Offwatch"

```typescript
const art = [
  color("██╗    ██╗███████╗██████╗  ██████╗██╗   ██╗██████╗ ████████╗███████╗██████╗ ", "cyan"),
  color("██║    ██║██╔════╝██╔══██╗██╔════╝██║   ██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗", "cyan"),
  color("██║ █╗ ██║█████╗  ██████╔╝██║     ██║   ██║██████╔╝   ██║   █████╗  ██║  ██║", "cyan"),
  color("██║███╗██║██╔══╝  ██╔══██╗██║     ██║   ██║██╔═══╝    ██║   ██╔══╝  ██║  ██║", "cyan"),
  color("╚███╔███╔╝███████╗██████╔╝╚██████╗╚██████╔╝██║        ██║   ███████╗██████╔╝", "cyan"),
  color(" ╚══╝╚══╝ ╚══════╝╚═════╝  ╚═════╝ ╚═════╝ ╚═╝        ╚═╝   ╚══════╝╚═════╝ ", "cyan"),
];
```

- [ ] **Step 2: Update ui-branding.ts — PAPERCLIP_* → OFFWATCH_***

- `PAPERCLIP_IN_WORKTREE` → `OFFWATCH_IN_WORKTREE`
- `PAPERCLIP_WORKTREE_NAME` → `OFFWATCH_WORKTREE_NAME`
- `PAPERCLIP_WORKTREE_COLOR` → `OFFWATCH_WORKTREE_COLOR`
- `PAPERCLIP_INSTANCE_ID` → `OFFWATCH_INSTANCE_ID`
- Meta tag names: `offwatch-worktree-*` → `offwatch-worktree-*`
- Comments: "Offwatch" → "Offwatch"

- [ ] **Step 3: Bulk replace offwatch → offwatch in server/src**

```bash
cd C:/Users/smith/ww/offwatch/server/src
grep -rl "offwatch" --include="*.ts" . | xargs sed -i 's/offwatch/offwatch/g'
grep -rl "Offwatch" --include="*.ts" . | xargs sed -i 's/Offwatch/Offwatch/g'
```

- [ ] **Step 4: Replace PAPERCLIP_ → OFFWATCH_ in server/src**

```bash
cd C:/Users/smith/ww/offwatch/server/src
grep -rl "PAPERCLIP_" --include="*.ts" . | xargs sed -i 's/PAPERCLIP_/OFFWATCH_/g'
```

- [ ] **Step 5: Fix test file references that mention offwatch in test names/data**

Some test file names contain "offwatch" (e.g., `offwatch-env.test.ts`). These should be renamed:
- `server/src/__tests__/offwatch-env.test.ts` → `server/src/__tests__/offwatch-env.test.ts`
- `server/src/__tests__/offwatch-skill-utils.test.ts` → `server/src/__tests__/offwatch-skill-utils.test.ts`

```bash
cd C:/Users/smith/ww/offwatch/server/src/__tests__
mv offwatch-env.test.ts offwatch-env.test.ts 2>/dev/null || true
mv offwatch-skill-utils.test.ts offwatch-skill-utils.test.ts 2>/dev/null || true
```

- [ ] **Step 6: Verify no offwatch references remain in server/src**

```bash
grep -r "offwatch" C:/Users/smith/ww/offwatch/server/src/ --include="*.ts" | grep -v node_modules | head -20
```

Expected: only external references or fixture data.

- [ ] **Step 7: Commit**

```bash
git add server/src
git commit -m "refactor: rename offwatch to offwatch in server source"
```

---

## Task 7: Bulk Rename in UI Source

**Files:**
- Modify: `ui/src/App.tsx`
- Modify: `ui/src/pages/*.tsx`
- Modify: `ui/src/components/*.tsx`
- Modify: `ui/src/context/*.tsx`
- Modify: `ui/src/api/*.ts`
- Modify: `ui/src/lib/*.ts`

- [ ] **Step 1: Bulk replace offwatch → offwatch in ui/src**

```bash
cd C:/Users/smith/ww/offwatch/ui/src
grep -rl "offwatch" --include="*.ts" --include="*.tsx" . | xargs sed -i 's/offwatch/offwatch/g'
grep -rl "Offwatch" --include="*.ts" --include="*.tsx" . | xargs sed -i 's/Offwatch/Offwatch/g'
```

- [ ] **Step 2: Verify no offwatch references remain**

```bash
grep -r "offwatch" C:/Users/smith/ww/offwatch/ui/src/ --include="*.ts" --include="*.tsx" | head -10
```

- [ ] **Step 3: Commit**

```bash
git add ui/src
git commit -m "refactor: rename offwatch to offwatch in UI source"
```

---

## Task 8: Bulk Rename in Packages

**Files:**
- Modify: `packages/adapter-*/src/**/*.ts`
- Modify: `packages/db/src/runtime-config.ts`
- Modify: `packages/db/src/backup.ts`
- Modify: `packages/shared/src/**/*.ts`
- Modify: `packages/mcp-server/src/**/*.ts`

- [ ] **Step 1: Replace PAPERCLIP_ → OFFWATCH_ in packages/**

```bash
cd C:/Users/smith/ww/offwatch/packages
grep -rl "PAPERCLIP_" --include="*.ts" . | xargs sed -i 's/PAPERCLIP_/OFFWATCH_/g'
```

- [ ] **Step 2: Verify**

```bash
grep -r "PAPERCLIP_" C:/Users/smith/ww/offwatch/packages/ --include="*.ts" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add packages
git commit -m "refactor: rename PAPERCLIP_* to OFFWATCH_* in packages"
```

---

## Task 9: Rename Docs, Scripts, Skills, and Docker Files

**Files:**
- Modify: `docs/**/*.md`
- Modify: `scripts/**/*.sh`, `scripts/**/*.ts`
- Modify: `skills/offwatch*/**/*.md`
- Modify: `docker/**/*`
- Modify: `Dockerfile`

- [ ] **Step 1: Bulk replace offwatch → offwatch in docs/**

```bash
cd C:/Users/smith/ww/offwatch/docs
grep -rl "offwatch" --include="*.md" . | xargs sed -i 's/offwatch/offwatch/g'
grep -rl "Offwatch" --include="*.md" . | xargs sed -i 's/Offwatch/Offwatch/g'
```

- [ ] **Step 2: Bulk replace in scripts/**

```bash
cd C:/Users/smith/ww/offwatch/scripts
grep -rl "offwatch" --include="*.sh" --include="*.ts" --include="*.js" --include="*.mjs" . | xargs sed -i 's/offwatch/offwatch/g'
grep -rl "PAPERCLIP" --include="*.sh" --include="*.ts" --include="*.js" --include="*.mjs" . | xargs sed -i 's/PAPERCLIP/OFFWATCH/g'
```

- [ ] **Step 3: Rename skills/offwatch* directories to offwatch***

```bash
cd C:/Users/smith/ww/offwatch/skills
mv offwatch offwatch 2>/dev/null || true
mv offwatch-create-agent offwatch-create-agent 2>/dev/null || true
```

- [ ] **Step 4: Bulk replace in skills/**

```bash
cd C:/Users/smith/ww/offwatch/skills
grep -rl "offwatch" --include="*.md" . | xargs sed -i 's/offwatch/offwatch/g'
grep -rl "Offwatch" --include="*.md" . | xargs sed -i 's/Offwatch/Offwatch/g'
```

- [ ] **Step 5: Bulk replace in docker/ and Dockerfile**

```bash
cd C:/Users/smith/ww/offwatch
sed -i 's/offwatch/offwatch/g' docker/docker-compose.yml docker/docker-compose.quickstart.yml docker/docker-compose.untrusted-review.yml
sed -i 's/offwatch/offwatch/g' docker/quadlet/offwatch.container
sed -i 's/offwatch/offwatch/g' Dockerfile
```

- [ ] **Step 6: Commit**

```bash
git add docs scripts skills docker Dockerfile
git commit -m "refactor: rename offwatch to offwatch in docs, scripts, skills, and docker"
```

---

## Task 10: Rename GitHub Workflows and Release Notes

**Files:**
- Modify: `.github/workflows/*.yml`
- Modify: `releases/*.md`

- [ ] **Step 1: Bulk replace offwatch in .github/workflows/**

```bash
cd C:/Users/smith/ww/offwatch
grep -rl "offwatch" --include="*.yml" --include="*.yaml" .github/ | xargs sed -i 's/offwatch/offwatch/g'
```

- [ ] **Step 2: Bulk replace in releases/**

```bash
cd C:/Users/smith/ww/offwatch/releases
grep -rl "offwatch" --include="*.md" . | xargs sed -i 's/offwatch/offwatch/g'
```

- [ ] **Step 3: Commit**

```bash
git add .github/releases
git commit -m "refactor: rename offwatch to offwatch in GitHub workflows and releases"
```

---

## Task 11: Verify Build and Tests

- [ ] **Step 1: Run pnpm install**

```bash
cd C:/Users/smith/ww/offwatch
pnpm install
```

- [ ] **Step 2: Run typecheck**

```bash
cd C:/Users/smith/ww/offwatch
pnpm typecheck 2>&1 | head -50
```

- [ ] **Step 3: Fix any broken imports from renamed functions**

If any imports reference old function names (e.g., `printOffwatchCliBanner` which is now `printOffwatchCliBanner`), fix them.

- [ ] **Step 4: Run CLI tests**

```bash
cd C:/Users/smith/ww/offwatch/cli
pnpm test:run 2>&1 | tail -30
```

- [ ] **Step 5: Fix any test failures**

---

## Self-Review Checklist

- [ ] ASCII art in `cli/src/utils/banner.ts` now says "OffWatch"
- [ ] Tagline updated to something orchestration-focused
- [ ] Program name is `offwatch` (not `offwatchai`)
- [ ] All `PAPERCLIP_*` env vars renamed to `OFFWATCH_*`
- [ ] `.offwatch` directory renamed to `.offwatch`
- [ ] All `offwatch` text in CLI commands/banners/help replaced with `offwatch`
- [ ] All `offwatch` text in server replaced with `offwatch`
- [ ] All `offwatch` text in UI replaced with `offwatch`
- [ ] All `offwatch` text in docs/scripts/skills replaced with `offwatch`
- [ ] No `offwatch` references remain in source code (excluding external data/fixtures)
- [ ] Build passes
- [ ] Tests pass
