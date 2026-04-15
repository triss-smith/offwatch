import got from "got";
import fs from "fs";
import fsa from "fs-extra";
import * as os from "node:os";
import tar from "tar";
import stream from "node:stream";
import { promisify } from "node:util";
import path from "node:path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const debugMode = process.env.DEBUG != null;
const pipeline = promisify(stream.pipeline);

const pkg = JSON.parse(fs.readFileSync(__dirname + "/../package.json", "utf8"));
const CLI_FILENAME = "offwatch";

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

const downloadRelease = async (versionDir) => {
  logDebug(`downloadRelease(${versionDir})`);
  const version = pkg.version;

  const releases = (await got
    .get(`https://api.github.com/repos/triss-smith/offwatch/releases`)
    .json());

  // Find the latest release that matches our major.minor
  const currentParts = extractVersionParts(version);
  const matchingRelease = releases
    .filter((release) => {
      const releaseVersion = extractVersionParts(release.tag_name);
      return (releaseVersion.major === currentParts.major &&
        releaseVersion.minor === currentParts.minor);
    })
    .sort((a, b) => {
      return Number(extractVersionParts(b.tag_name).patch) >
        Number(extractVersionParts(a.tag_name).patch)
        ? 1
        : -1;
    })[0] || releases[0];

  if (!matchingRelease) {
    throw new Error(`No releases found for ${currentParts.major}.${currentParts.minor}`);
  }

  const platform = getPlatform();
  logDebug(`Looking for platform: ${platform} in release ${matchingRelease.tag_name}`);

  const asset = matchingRelease.assets.find((asset) => {
    return asset.name.includes(platform);
  });

  if (!asset) {
    throw new Error(`${platform} is not currently supported. Check GitHub releases for available platforms.`);
  }

  try {
    fsa.mkdirpSync(versionDir);
  } catch (e) { }

  const ext = asset.name.endsWith(".js") ? ".js" : "";
  const filePath = path.join(versionDir, CLI_FILENAME + ext);
  const tempPath = path.join(versionDir, asset.name);

  logDebug(`Downloading ${asset.browser_download_url}`);

  await pipeline(got.stream(asset.browser_download_url), fs.createWriteStream(tempPath));

  if (ext) {
    // For .js files, rename to expected name
    fs.renameSync(tempPath, filePath);
  } else {
    // For compressed files, decompress
    await pipeline(fs.createReadStream(tempPath), tar.x({
      C: versionDir,
      strip: 1,
    }));
    fs.unlinkSync(tempPath);
  }
};

export const loadCLIBinPath = async (cwd) => {
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
