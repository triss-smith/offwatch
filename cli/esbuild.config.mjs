/**
 * esbuild configuration for building the offwatch CLI for npm.
 *
 * Bundles all workspace packages into a single file.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

// All workspace packages to bundle into the CLI
const workspacePaths = [
  "cli",
  "packages/db",
  "packages/shared",
  "packages/adapter-utils",
  "packages/adapters/claude-local",
  "packages/adapters/codex-local",
  "packages/adapters/cursor-local",
  "packages/adapters/gemini-local",
  "packages/adapters/opencode-local",
  "packages/adapters/pi-local",
  "packages/adapters/openclaw-gateway",
  "server",
  "ui",
];

// Collect all external (non-workspace) npm package names
const externals = new Set();
const monorepoScopes = new Set(["@paperclipai/", "@offwatch/"]);

for (const p of workspacePaths) {
  try {
    const pkg = JSON.parse(readFileSync(resolve(repoRoot, p, "package.json"), "utf8"));
    for (const name of Object.keys(pkg.dependencies || {})) {
      // Only mark as external if it's NOT a monorepo package
      if (!monorepoScopes.some((scope) => name.startsWith(scope))) {
        externals.add(name);
      }
    }
    for (const name of Object.keys(pkg.optionalDependencies || {})) {
      if (!monorepoScopes.some((scope) => name.startsWith(scope))) {
        externals.add(name);
      }
    }
  } catch {
    // Skip if package.json not found
  }
}
// Remove common Node built-ins
externals.delete("node");
// Add embedded-postgres platform-specific packages (optional, only resolved at runtime)
externals.add("@embedded-postgres/darwin-arm64");
externals.add("@embedded-postgres/darwin-x64");
externals.add("@embedded-postgres/linux-arm64");
externals.add("@embedded-postgres/linux-arm");
externals.add("@embedded-postgres/linux-ia32");
externals.add("@embedded-postgres/linux-ppc64");
externals.add("@embedded-postgres/linux-x64");
externals.add("@embedded-postgres/win32-ia32");
externals.add("@embedded-postgres/win32-x64");
// lightningcss native bindings
externals.add("lightningcss");

/** @type {import('esbuild').BuildOptions} */
export default {
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/index.js",
  banner: { js: "#!/usr/bin/env node" },
  external: [...externals].sort(),
  treeShaking: true,
  sourcemap: true,
};
