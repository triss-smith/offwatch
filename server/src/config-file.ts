import fs from "node:fs";
import { offwatchConfigSchema, type OffwatchConfig } from "@offwatch/shared";
import { resolveOffwatchConfigPath } from "./paths.js";

export function readConfigFile(): OffwatchConfig | null {
  const configPath = resolveOffwatchConfigPath();

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return offwatchConfigSchema.parse(raw);
  } catch {
    return null;
  }
}
