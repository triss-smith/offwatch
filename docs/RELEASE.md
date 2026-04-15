# Offwatch Release Process

## Overview

Offwatch uses a paperclip-style distribution where:
1. `npm install offwatch` installs a tiny CLI package
2. A `postinstall` script downloads a pre-built binary from GitHub releases
3. The binary contains the full application (server + CLI)

## One-time Setup

### Create npm Packages

1. **offwatch-releases** - Downloads the binary from GitHub
   ```bash
   cd releases
   npm publish --access public
   ```

2. **offwatch** - The CLI that downloads and runs the binary
   ```bash
   cd cli
   npm publish --access public
   ```

## Release Process

### Step 1: Build the CLI Binary

Build the bundled CLI binary for Windows (or the target platform):

```bash
cd cli
node --input-type=module -e "import esbuild from 'esbuild'; import config from './esbuild.config.mjs'; await esbuild.build(config);"
```

The binary is output to `cli/dist/offwatch.js`.

### Step 2: Upload to GitHub Releases

Tag the release:
```bash
git tag v0.x.x
git push origin master --tags
```

Or create a release and upload the binary:
```bash
gh release create v0.x.x --title "Offwatch v0.x.x" --notes "Release notes"
gh release upload v0.x.x cli/dist/offwatch.js --clobber
```

The binary must be named with platform identifier for the downloader to find it:
- `offwatch-win32-x64.js` (Windows)
- `offwatch-darwin-x64.js` (macOS)
- `offwatch-linux-x64.js` (Linux)

### Step 3: Publish npm Packages

```bash
# Update version in packages
# Edit releases/package.json and cli/package.json

# Publish releases package
cd releases
npm publish --access public

# Publish CLI package
cd ../cli
npm publish --access public
```

### Step 4: Test

```bash
npm install -g offwatch
offwatch --help
```

## How It Works

### Package Structure

```
offwatch (npm package)
├── bin/offwatch.js          # Runner script
├── lib/downloader.js        # Downloads binary from GitHub
└── package.json

offwatch-releases (npm package)
└── lib/index.js            # GitHub API download logic
```

### Download Flow

1. User runs `offwatch`
2. `bin/offwatch.js` calls `lib/downloader.js`
3. Downloader checks GitHub releases for versioned binary
4. Downloads binary to `node_modules/.offwatch/<version>/`
5. Runs the binary

### Adding New Platforms

To add support for a new platform:

1. Build the binary for that platform
2. Upload to GitHub release with the platform suffix (e.g., `offwatch-linux-arm64.js`)
3. Update `lib/downloader.js` to recognize the new platform in `getPlatform()`
