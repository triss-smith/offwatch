# Rename @paperclipai/* to @offwatch/* Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename all packages from @paperclipai/* scope to @offwatch/* scope, eliminating workspace:* dependency issues and aligning package names with the CLI product name.

**Architecture:** This is a monorepo refactor. All @paperclipai/* packages are renamed to @offwatch/* and all internal imports are updated. The monorepo structure remains the same; only package names and imports change. Published npm packages will use the @offwatch/* scope.

**Tech Stack:** pnpm monorepo, TypeScript, Node.js

---

## Phase 1: Package Renames

### Task 1: Rename shared package

**Files:**
- Modify: `packages/shared/package.json`
- Modify: `packages/shared/package.json` (name field only)

- [ ] **Step 1: Update package.json name**

```json
{
  "name": "@offwatch/shared"
}
```

- [ ] **Step 2: Commit**

```bash
cd packages/shared
git add package.json
git commit -m "refactor: rename @paperclipai/shared to @offwatch/shared"
```

---

### Task 2: Rename adapter-utils package

**Files:**
- Modify: `packages/adapter-utils/package.json`

- [ ] **Step 1: Update package.json name**

```json
{
  "name": "@offwatch/adapter-utils"
}
```

- [ ] **Step 2: Update dependency on @paperclipai/shared → @offwatch/shared**

```json
{
  "dependencies": {
    "@offwatch/shared": "workspace:*"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "refactor: rename @paperclipai/adapter-utils to @offwatch/adapter-utils"
```

---

### Task 3: Rename db package

**Files:**
- Modify: `packages/db/package.json`

- [ ] **Step 1: Update package.json name and dependency**

```json
{
  "name": "@offwatch/db",
  "dependencies": {
    "@offwatch/shared": "workspace:*"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "refactor: rename @paperclipai/db to @offwatch/db"
```

---

### Task 4: Rename mcp-server package

**Files:**
- Modify: `packages/mcp-server/package.json`

- [ ] **Step 1: Update package.json name and dependency**

```json
{
  "name": "@offwatch/mcp-server",
  "dependencies": {
    "@offwatch/shared": "workspace:*"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "refactor: rename @paperclipai/mcp-server to @offwatch/mcp-server"
```

---

### Task 5: Rename adapter packages (claude-local, codex-local, cursor-local, gemini-local, openclaw-gateway, opencode-local, pi-local)

**Files:**
- Modify: `packages/adapters/claude-local/package.json`
- Modify: `packages/adapters/codex-local/package.json`
- Modify: `packages/adapters/cursor-local/package.json`
- Modify: `packages/adapters/gemini-local/package.json`
- Modify: `packages/adapters/openclaw-gateway/package.json`
- Modify: `packages/adapters/opencode-local/package.json`
- Modify: `packages/adapters/pi-local/package.json`

- [ ] **Step 1: Update each adapter package.json**

For each adapter (claude-local, codex-local, cursor-local, gemini-local, openclaw-gateway, opencode-local, pi-local):

```json
{
  "name": "@offwatch/adapter-<name>",
  "dependencies": {
    "@offwatch/adapter-utils": "workspace:*"
  }
}
```

- [ ] **Step 2: Commit all adapter renames**

```bash
git add packages/adapters/*/package.json
git commit -m "refactor: rename @paperclipai/adapter-* to @offwatch/adapter-*"
```

---

### Task 6: Rename plugin-sdk package

**Files:**
- Modify: `packages/plugins/sdk/package.json`

- [ ] **Step 1: Update package.json name and dependencies**

```json
{
  "name": "@offwatch/plugin-sdk",
  "dependencies": {
    "@offwatch/shared": "workspace:*"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/plugins/sdk/package.json
git commit -m "refactor: rename @paperclipai/plugin-sdk to @offwatch/plugin-sdk"
```

---

### Task 7: Rename create-paperclip-plugin package

**Files:**
- Modify: `packages/plugins/create-paperclip-plugin/package.json`

- [ ] **Step 1: Update package.json name and dependency**

```json
{
  "name": "@offwatch/create-offwatch-plugin"
}
```

Note: Renaming from "create-paperclip-plugin" to "create-offwatch-plugin" for consistency.

- [ ] **Step 2: Commit**

```bash
git add packages/plugins/create-paperclip-plugin/package.json
git commit -m "refactor: rename @paperclipai/create-paperclip-plugin to @offwatch/create-offwatch-plugin"
```

---

### Task 8: Rename plugin example packages

**Files:**
- Modify: `packages/plugins/examples/plugin-hello-world-example/package.json`
- Modify: `packages/plugins/examples/plugin-kitchen-sink-example/package.json`
- Modify: `packages/plugins/examples/plugin-file-browser-example/package.json`
- Modify: `packages/plugins/examples/plugin-authoring-smoke-example/package.json`

- [ ] **Step 1: Update each example package.json**

```json
{
  "name": "@offwatch/plugin-<example-name>",
  "dependencies": {
    "@offwatch/plugin-sdk": "workspace:*"
  }
}
```

- [ ] **Step 2: Commit all plugin example renames**

```bash
git add packages/plugins/examples/*/package.json
git commit -m "refactor: rename plugin examples to @offwatch/*"
```

---

### Task 9: Rename server package

**Files:**
- Modify: `server/package.json`

- [ ] **Step 1: Update package.json name and dependencies**

```json
{
  "name": "@offwatch/server"
}
```

Update all workspace:* dependencies from @paperclipai/* to @offwatch/*.

- [ ] **Step 2: Commit**

```bash
git add server/package.json
git commit -m "refactor: rename @paperclipai/server to @offwatch/server"
```

---

### Task 10: Rename ui package

**Files:**
- Modify: `ui/package.json`

- [ ] **Step 1: Update package.json name and dependencies**

```json
{
  "name": "@offwatch/ui"
}
```

Update all workspace:* dependencies from @paperclipai/* to @offwatch/*.

- [ ] **Step 2: Commit**

```bash
git add ui/package.json
git commit -m "refactor: rename @paperclipai/ui to @offwatch/ui"
```

---

### Task 11: Update root package.json scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update all pnpm --filter references**

Change all `@paperclipai/*` to `@offwatch/*` in scripts:

```json
{
  "scripts": {
    "db:generate": "pnpm --filter @offwatch/db generate",
    "db:migrate": "pnpm --filter @offwatch/db migrate",
    "dev": "pnpm --filter @offwatch/server exec tsx ../scripts/dev-runner.ts watch",
    "dev:server": "pnpm --filter @offwatch/server dev",
    "dev:ui": "pnpm --filter @offwatch/ui dev"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "refactor: update root package.json to use @offwatch/*"
```

---

## Phase 2: Update Source File Imports

### Task 12: Update CLI source imports

**Files:**
- Modify: `cli/src/adapters/registry.ts` (all @paperclipai imports)
- Modify: `cli/src/adapters/process/index.ts`
- Modify: `cli/src/adapters/http/index.ts`
- Modify: `cli/src/adapters/index.ts`
- Modify: `cli/src/commands/db-backup.ts`
- Modify: `cli/src/commands/worktree.ts`
- Modify: `cli/src/commands/worktree-merge-history-lib.ts`
- Modify: `cli/src/commands/routines.ts`
- Modify: `cli/src/commands/onboard.ts`
- Modify: `cli/src/commands/auth-bootstrap-ceo.ts`
- Modify: `cli/src/commands/run.ts`
- Modify: `cli/src/commands/heartbeat-run.ts`
- Modify: `cli/src/commands/client/agent.ts`
- Modify: `cli/src/commands/client/approval.ts`
- Modify: `cli/src/commands/client/zip.ts`
- Modify: `cli/src/commands/client/activity.ts`
- Modify: `cli/src/commands/client/company.ts`
- Modify: `cli/src/commands/client/feedback.ts`
- Modify: `cli/src/commands/client/issue.ts`
- Modify: `cli/src/commands/client/dashboard.ts`
- Modify: `cli/src/checks/deployment-auth-check.ts`
- Modify: `cli/src/config/server-bind.ts`
- Modify: `cli/src/prompts/server.ts`
- Modify: `cli/src/prompts/secrets.ts`
- Modify: `cli/src/__tests__/company-delete.test.ts`
- Modify: `cli/src/__tests__/company.test.ts`
- Modify: `cli/src/__tests__/feedback.test.ts`
- Modify: `cli/src/__tests__/network-bind.test.ts`
- Modify: `cli/src/__tests__/helpers/embedded-postgres.ts`
- Modify: `cli/src/__tests__/routines.test.ts`
- Modify: `cli/src/__tests__/worktree.test.ts`
- Modify: `cli/esbuild.config.mjs` (monorepoScopes array)

- [ ] **Step 1: Bulk replace all @paperclipai/ imports to @offwatch/**

```bash
cd cli
grep -r "@paperclipai/" --include="*.ts" --include="*.mjs" src/ -l | xargs sed -i 's/@paperclipai\//@offwatch\//g'
```

- [ ] **Step 2: Verify imports updated**

```bash
grep -r "@paperclipai/" cli/src/ cli/esbuild.config.mjs 2>/dev/null | grep -v node_modules
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add cli/src cli/esbuild.config.mjs
git commit -m "refactor: update CLI imports from @paperclipai/* to @offwatch/*"
```

---

### Task 13: Update packages/* source imports

**Files:**
- Modify: `packages/plugins/sdk/src/worker-rpc-host.ts`
- Modify: `packages/plugins/sdk/src/ui/types.ts`
- Modify: `packages/adapters/cursor-local/src/ui/parse-stdout.ts`
- Modify: `packages/adapters/cursor-local/src/ui/build-config.ts`
- Modify: `packages/mcp-server/src/tools.ts`

- [ ] **Step 1: Bulk replace @paperclipai/ imports to @offwatch/**

```bash
cd packages
grep -r "@paperclipai/" --include="*.ts" --include="*.tsx" --include="*.mjs" . -l | xargs sed -i 's/@paperclipai\//@offwatch\//g'
```

- [ ] **Step 2: Verify imports updated**

```bash
grep -r "@paperclipai/" packages/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add packages
git commit -m "refactor: update packages/* imports from @paperclipai/* to @offwatch/*"
```

---

### Task 14: Update ui source imports

**Files:**
- Modify: `ui/src/api/activity.ts`
- Modify: `ui/src/context/WorkspaceContext.tsx`
- Modify: `ui/src/context/EditorAutocompleteContext.tsx`
- Modify: `ui/src/api/access.ts`
- Modify: `ui/src/context/LiveUpdatesProvider.tsx`
- Modify: `ui/src/plugins/slots.tsx`

- [ ] **Step 1: Bulk replace @paperclipai/ imports to @offwatch/**

```bash
cd ui
grep -r "@paperclipai/" --include="*.ts" --include="*.tsx" src/ -l | xargs sed -i 's/@paperclipai\//@offwatch\//g'
```

- [ ] **Step 2: Verify imports updated**

```bash
grep -r "@paperclipai/" ui/src/ 2>/dev/null
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add ui/src
git commit -m "refactor: update ui imports from @paperclipai/* to @offwatch/*"
```

---

## Phase 3: Build & Test

### Task 15: Run pnpm install to update lockfile

- [ ] **Step 1: Run pnpm install**

```bash
cd C:/Users/smith/ww/offwatch
pnpm install
```

- [ ] **Step 2: Verify lockfile updated**

```bash
grep "@offwatch/" pnpm-lock.yaml | head -20
```

Expected: should see @offwatch/ dependencies

---

### Task 16: Build all packages

- [ ] **Step 1: Build shared first**

```bash
cd packages/shared
pnpm build
```

- [ ] **Step 2: Build adapter-utils**

```bash
cd packages/adapter-utils
pnpm build
```

- [ ] **Step 3: Build db**

```bash
cd packages/db
pnpm build
```

- [ ] **Step 4: Build mcp-server**

```bash
cd packages/mcp-server
pnpm build
```

- [ ] **Step 5: Build plugin-sdk**

```bash
cd packages/plugins/sdk
pnpm build
```

- [ ] **Step 6: Build all adapters**

```bash
cd packages/adapters
for dir in */; do cd "$dir" && pnpm build 2>&1; cd ..; done
```

- [ ] **Step 7: Verify all builds pass**

```bash
pnpm -r build --dry-run 2>&1 | head -30
```

---

### Task 17: Run typecheck

- [ ] **Step 1: Run typecheck**

```bash
cd C:/Users/smith/ww/offwatch
pnpm typecheck 2>&1
```

- [ ] **Step 2: Fix any type errors**

Address any import/path errors found during typecheck.

---

### Task 18: Run tests

- [ ] **Step 1: Run CLI tests**

```bash
cd cli
pnpm test:run 2>&1
```

- [ ] **Step 2: Fix any test failures**

---

## Phase 4: Publish Packages

### Task 19: Publish @offwatch/shared

```bash
cd packages/shared
npm publish --access public
```

---

### Task 20: Publish remaining packages in order

Publish order (dependency order):
1. @offwatch/shared
2. @offwatch/adapter-utils
3. @offwatch/db
4. @offwatch/mcp-server
5. @offwatch/plugin-sdk
6. @offwatch/adapter-claude-local
7. @offwatch/adapter-codex-local
8. @offwatch/adapter-cursor-local
9. @offwatch/adapter-gemini-local
10. @offwatch/adapter-openclaw-gateway
11. @offwatch/adapter-opencode-local
12. @offwatch/adapter-pi-local
13. @offwatch/create-offwatch-plugin
14. @offwatch/server
15. @offwatch/ui

```bash
# For each package:
cd packages/<package>
npm version patch  # or minor/major as appropriate
npm publish --access public
```

---

## Phase 5: Update CLI for Published Packages

### Task 21: Update CLI package.json dependencies

**Files:**
- Modify: `cli/package.json`

- [ ] **Step 1: Update dependencies to use published @offwatch/* packages**

Remove all workspace:* dependencies and replace with actual version ranges:

```json
{
  "dependencies": {
    "@offwatch/shared": "^0.1.0",
    "@offwatch/db": "^0.1.0",
    "@offwatch/adapter-utils": "^0.1.0",
    "@offwatch/adapter-claude-local": "^0.1.0",
    "@offwatch/adapter-codex-local": "^0.1.0",
    "@offwatch/adapter-cursor-local": "^0.1.0",
    "@offwatch/adapter-gemini-local": "^0.1.0",
    "@offwatch/adapter-openclaw-gateway": "^0.1.0",
    "@offwatch/adapter-opencode-local": "^0.1.0",
    "@offwatch/adapter-pi-local": "^0.1.0",
    "@offwatch/server": "^0.1.0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add cli/package.json
git commit -m "refactor: update CLI to use published @offwatch/* packages"
```

---

### Task 22: Publish CLI package

```bash
cd cli
npm version patch
npm publish --access public
```

---

## Self-Review Checklist

- [ ] All 15+ package.json files renamed from @paperclipai/* to @offwatch/*
- [ ] All source file imports updated (run `grep -r "@paperclipai/" . --include="*.ts" --include="*.tsx" | grep -v node_modules` - should return nothing)
- [ ] All pnpm filter scripts updated in root package.json
- [ ] All workspace:* dependencies updated from @paperclipai/* to @offwatch/*
- [ ] pnpm install runs without errors
- [ ] All packages build successfully
- [ ] Typecheck passes
- [ ] Tests pass
- [ ] All packages published to npm in correct order
- [ ] CLI published with published @offwatch/* dependencies

---

## Notes

- The bundled CLI binary in `cli/bin/0.5.17/offwatch.js` is generated and should NOT be manually edited - it will be regenerated during build
- Plugin examples depend on plugin-sdk and may need additional updates after SDK is renamed
- The "create-paperclip-plugin" is being renamed to "create-offwatch-plugin" for consistency
- This plan assumes all packages are published with matching versions initially (0.1.0 or similar)
