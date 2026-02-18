/**
 * Merge class names — lightweight replacement for clsx + tailwind-merge.
 * Once `clsx` and `tailwind-merge` are installed, you can replace this with:
 *   import { clsx, type ClassValue } from "clsx";
 *   import { twMerge } from "tailwind-merge";
 *   export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
 */
export type ClassValue = string | undefined | null | false | 0;

export function cn(...inputs: ClassValue[]): string {
    return inputs.filter(Boolean).join(" ");
}
