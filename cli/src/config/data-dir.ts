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
  process.env.PAPERCLIP_HOME = resolvedDataDir;

  if (support.hasConfigOption) {
    const hasConfigOverride =
      Boolean(options.config?.trim()) ||
      Boolean(process.env.OFFWATCH_CONFIG?.trim()) ||
      Boolean(process.env.PAPERCLIP_CONFIG?.trim());
    if (!hasConfigOverride) {
      const instanceId = resolveOffwatchInstanceId(options.instance);
      process.env.OFFWATCH_INSTANCE_ID = instanceId;
      process.env.PAPERCLIP_INSTANCE_ID = instanceId;
      const configPath = resolveDefaultConfigPath(instanceId);
      process.env.OFFWATCH_CONFIG = configPath;
      process.env.PAPERCLIP_CONFIG = configPath;
    }
  }

  if (support.hasContextOption) {
    const hasContextOverride =
      Boolean(options.context?.trim()) ||
      Boolean(process.env.OFFWATCH_CONTEXT?.trim()) ||
      Boolean(process.env.PAPERCLIP_CONTEXT?.trim());
    if (!hasContextOverride) {
      const contextPath = resolveDefaultContextPath();
      process.env.OFFWATCH_CONTEXT = contextPath;
      process.env.PAPERCLIP_CONTEXT = contextPath;
    }
  }

  return resolvedDataDir;
}
