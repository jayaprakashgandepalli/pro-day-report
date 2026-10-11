/**
 * Utility functions for Indian phone number sanitization and validation.
 */

export function normalizePhoneNumber(rawPhone: string | null | undefined): string {
  if (!rawPhone) return '';
  
  // Remove all non-digit characters (+, spaces, hyphens, brackets, etc.)
  const digits = rawPhone.toString().replace(/\D/g, '');
  
  // If user included country code (e.g., 919876543210) and total is 12 digits
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  
  // If user started with 0 (e.g., 09876543210) and total is 11 digits
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  
  // If longer than 10 digits, extract the last 10 digits
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  
  return digits;
}

export function isValidIndianMobile(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Valid Indian mobile: starts with 6, 7, 8, or 9 and exactly 10 digits
  return /^[6-9]\d{9}$/.test(normalized);
}
