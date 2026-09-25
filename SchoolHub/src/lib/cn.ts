export type ClassValue = string | false | null | undefined;

/**
 * Minimal className joiner — keeps the shell dependency-free.
 * Swap for `clsx` + `tailwind-merge` later if the class list grows.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}