import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format phone number as user types
 * Supports both US format (555) 123-4567 and international +1 (555) 123-4567
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters except +
  let cleaned = value.replace(/[^\d+]/g, "");
  
  // If it starts with +1, handle international format
  if (cleaned.startsWith("+1")) {
    const digits = cleaned.slice(2); // Remove +1
    // Limit to 10 digits (US phone number)
    const limitedDigits = digits.slice(0, 10);
    if (limitedDigits.length === 0) return "+1 ";
    if (limitedDigits.length <= 3) return `+1 (${limitedDigits}`;
    if (limitedDigits.length <= 6) return `+1 (${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
    return `+1 (${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
  }
  
  // If it starts with just +, allow it (for other countries)
  if (cleaned.startsWith("+") && cleaned.length > 1) {
    return cleaned; // Allow other international formats as-is
  }
  
  // Handle US format without country code
  // Limit to 10 digits
  const digits = cleaned.slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
