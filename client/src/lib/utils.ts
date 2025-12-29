import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// This function helps in easily joining conditional CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
