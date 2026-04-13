function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function hasLegacyWorkingDirectory(value: unknown): boolean {
  return asNonEmptyString(value) !== null;
}

export function shouldShowLegacyWorkingDirectoryField(_input: {
  isCreate: boolean;
  adapterConfig: Record<string, unknown> | null | undefined;
}): boolean {
  return true;
}
