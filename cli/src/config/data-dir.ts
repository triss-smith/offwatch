import path from "node:path";
import {
  expandHomePrefix,
  resolveDefaultConfigPath,
  resolveDefaultContextPath,
  resolveOffwatchInstanceId,
} from "./home.js";

export interface DataDirOptionLike {
  dataDir?: string;
  config?: string;
  context?: string;
  instance?: string;
}

export interface DataDirCommandSupport {
  hasConfigOption?: boolean;
  hasContextOption?: boolean;
}

export function applyDataDirOverride(
  options: DataDirOptionLike,
  support: DataDirCommandSupport = {},
): string | null {
  const rawDataDir = options.dataDir?.trim();
  if (!rawDataDir) return null;

  const resolvedDataDir = path.resolve(expandHomePrefix(rawDataDir));
  process.env.OFFWATCH_HOME = resolvedDataDir;

  if (support.hasConfigOption) {
    const hasConfigOverride = Boolean(options.config?.trim()) || Boolean(process.env.OFFWATCH_CONFIG?.trim());
    if (!hasConfigOverride) {
      const instanceId = resolveOffwatchInstanceId(options.instance);
      process.env.OFFWATCH_INSTANCE_ID = instanceId;
      process.env.OFFWATCH_CONFIG = resolveDefaultConfigPath(instanceId);
    }
  }

  if (support.hasContextOption) {
    const hasContextOverride = Boolean(options.context?.trim()) || Boolean(process.env.OFFWATCH_CONTEXT?.trim());
    if (!hasContextOverride) {
      process.env.OFFWATCH_CONTEXT = resolveDefaultContextPath();
    }
  }

  return resolvedDataDir;
}
