import { cn } from "../lib/utils";

interface OffwatchIconProps {
  className?: string;
}

/**
 * Offwatch icon — paperclip-style symbol representing the control-plane loop.
 * Replaces the generic Zap icon for the offwatch adapter type.
 *
 * Styled as a simple paperclip-inspired mark to reflect the product name and branding.
 */
export function OffwatchIcon({ className }: OffwatchIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
    >
      {/* Paperclip body — simple loop */}
      <path d="M8 6 C6 6 4 8 4 11 C4 15 8 19 12 19 C16 19 20 15 20 11 C20 7 16 3 12 3" />
      {/* Inner loop accent */}
      <path d="M10 8 C9 8 8 9 8 11 C8 13 9 15 11 15 C13 15 15 13 15 11" />
      {/* Cross line at top suggesting a clip/attachment */}
      <line x1="12" y1="3" x2="12" y2="5" strokeWidth="1.2" />
    </svg>
  );
}