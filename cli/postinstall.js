#!/usr/bin/env node
// Inlined downloader using native https module to avoid dependency issues
const { spawn } = require("child_process");
const fs = require("fs");
const fsa = require("fs-extra");
const os = require("os");
const path = require("path");
const https = require("https");

const debugMode = process.env.DEBUG != null;
const CLI_FILENAME = "offwatch";

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));

const logDebug = (message) => {
  if (debugMode) {
    console.debug(`[DEBUG] ${message}`);
  }
};

const getPlatform = () => {
  const platform = os.platform();
  if (platform === "win32") return "win32-x64";
  if (platform === "darwin") return "darwin-x64";
  return "linux-x64";
};

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "offwatch-cli" } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        https.get(response.headers.location, { headers: { "User-Agent": "offwatch-cli" } }, (resp) => {
          resp.pipe(file);
          file.on("finish", () => { file.close(); resolve(); });
        }).on("error", reject);
      } else {
        response.pipe(file);
        file.on("finish", () => { file.close(); resolve(); });
      }
    }).on("error", reject);
  });
};

const downloadRelease = async (versionDir) => {
  logDebug(`downloadRelease(${versionDir})`);
  const version = pkg.version;

  const releasesJson = await new Promise((resolve, reject) => {
    https.get(
      `https://api.github.com/repos/triss-smith/offwatch/releases`,
      { headers: { "User-Agent": "offwatch-cli" } },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => { resolve(JSON.parse(data)); });
      }
    ).on("error", reject);
  });

  const currentParts = extractVersionParts(version);
  const matchingRelease = releasesJson
    .filter((release) => {
      const releaseVersion = extractVersionParts(release.tag_name);
      return (
        releaseVersion.major === currentParts.major &&
        releaseVersion.minor === currentParts.minor
      );
    })
    .sort((a, b) => {
      return (
        Number(extractVersionParts(b.tag_name).patch) >
        Number(extractVersionParts(a.tag_name).patch)
          ? 1
          : -1
      );
    })[0] || releasesJson[0];

  if (!matchingRelease) {
    throw new Error(
      `No releases found for ${currentParts.major}.${currentParts.minor}`
    );
  }

  const platform = getPlatform();
  logDebug(
    `Looking for platform: ${platform} in release ${matchingRelease.tag_name}`
  );

  const asset = matchingRelease.assets.find((asset) => {
    return asset.name.includes(platform);
  });

  if (!asset) {
    throw new Error(
      `${platform} is not currently supported. Check GitHub releases for available platforms.`
    );
  }

  try {
    fsa.mkdirpSync(versionDir);
  } catch (e) {}

  const ext = asset.name.endsWith(".js") ? ".js" : "";
  const filePath = path.join(versionDir, CLI_FILENAME + ext);
  const tempPath = path.join(versionDir, asset.name);

  logDebug(`Downloading ${asset.browser_download_url}`);

  await downloadFile(asset.browser_download_url, tempPath);

  if (ext) {
    fs.renameSync(tempPath, filePath);
  } else {
    const toGitPath = (p) =>
      p
        .replace(/\\/g, "/")
        .replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`);
    const tarPath = toGitPath(tempPath);
    const tarCwd = toGitPath(versionDir);

    await new Promise((resolve, reject) => {
      const args = ["-xzf", tarPath, "-C", tarCwd];
      logDebug(`Running: tar ${args.join(" ")}`);
      const proc = spawn("tar", args);
      let stderr = "";
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      proc.on("close", (code) => {
        if (code === 0) {
          fs.unlinkSync(tempPath);
          resolve();
        } else {
          reject(new Error(`tar exited with code ${code}: ${stderr}`));
        }
      });
      proc.on("error", reject);
    });
  }

  const binDir = path.join(versionDir, "..");
  fs.copyFileSync(
    path.join(__dirname, "package.json"),
    path.join(binDir, "package.json")
  );
};

const loadCLIBinPath = async (cwd) => {
  const versionDir = path.join(cwd, pkg.version);
  const ext = process.platform === "win32" ? ".js" : "";
  const binPath = path.join(versionDir, CLI_FILENAME + ext);
  logDebug(`loadCLIBinPath: ${binPath}`);

  if (!fs.existsSync(binPath)) {
    await downloadRelease(versionDir);
  }

  logDebug(`returning ${binPath}`);
  return binPath;
};

const extractVersionParts = (version) => {
  const [major, minor, patch] = version.replace(/^v/, "").split(".");
  return { major, minor, patch };
};

// Skip download in monorepo development (workspace packages are used directly)
if (!process.cwd().includes("node_modules")) {
  loadCLIBinPath(__dirname)
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
