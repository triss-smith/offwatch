#!/usr/bin/env node
import { loadCLIBinPath } from "@offwatch/releases";
import { execSync } from "child_process";

const binPath = await loadCLIBinPath(__dirname);
execSync(binPath, { stdio: "inherit" });
