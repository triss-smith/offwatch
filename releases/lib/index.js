import got from "got";
import fs from "fs";
import fsa from "fs-extra";
import * as os from "node:os";
import tar from "tar";
import stream from "node:stream";
import { promisify } from "node:util";
import path from "path";
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
  const currentVersion = extractVersionParts(version);

  const releases = (await got
    .get(`https://api.github.com/repos/triss-smith/offwatch/releases`)
    .json());

  const matchingRelease = releases
    .filter((release) => {
      const releaseVersion = extractVersionParts(release.tag_name);
      return (releaseVersion.major === currentVersion.major &&
        releaseVersion.minor === currentVersion.minor);
    })
    .sort((a, b) => {
      return Number(extractVersionParts(a.tag_name).patch) >
        Number(extractVersionParts(b.tag_name).patch)
        ? -1
        : 1;
    })[0] || releases[0];

  if (!matchingRelease) {
    throw new Error(`No matching release for ${currentVersion.major}.${currentVersion.minor}`);
  }

  const platform = getPlatform();
  const asset = matchingRelease.assets.find((asset) => {
    return asset.name.includes(platform);
  });

  if (!asset) {
    throw new Error(`${platform} is not currently supported`);
  }

  try {
    fsa.mkdirpSync(versionDir);
  } catch (e) { }

  const filePath = path.join(versionDir, CLI_FILENAME);
  logDebug(`download(${asset.browser_download_url})`);

  // For .js files, just download directly
  if (asset.name.endsWith(".js")) {
    await pipeline(got.stream(asset.browser_download_url), fs.createWriteStream(filePath));
    fs.chmodSync(filePath, 0o755);
  } else {
    // For compressed files
    const tarPath = path.join(versionDir, path.basename(asset.browser_download_url));
    await pipeline(got.stream(asset.browser_download_url), fs.createWriteStream(tarPath));
    await decompress(tarPath, filePath);
  }
};

const decompress = async (tarPath, outPath) => {
  logDebug(`decompress(${tarPath})`);
  await pipeline(fs.createReadStream(tarPath), tar.x({
    C: path.dirname(outPath),
    strip: 1,
  }));
  fs.chmodSync(outPath, 0o755);
};

export const loadCLIBinPath = async (cwd) => {
  const versionDir = path.join(cwd, pkg.version);
  const binPath = path.join(versionDir, CLI_FILENAME);
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
