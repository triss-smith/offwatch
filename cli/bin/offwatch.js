#!/usr/bin/env node
import { loadCLIBinPath } from "../lib/downloader.js";
import { spawn } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const binPath = await loadCLIBinPath(__dirname);

// Run the downloaded CLI binary
spawn("node", [binPath], { stdio: "inherit" });
