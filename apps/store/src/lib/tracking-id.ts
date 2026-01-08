/**
 * Generate a professional tracking ID based on brand name and order ID.
 * Format: First 3 letters of brand name + 7 random digits
 * Example: "NIK1234567", "ADIDAS9876543"
 * - Uses only A–Z and 0–9
 * - Uppercase
 * - Total length: 10 characters (3 letters + 7 digits)
 */
export function generateTrackingId(brandName: string | undefined | null, orderId: string, maxLength: number = 10): string {
  // Extract first 3 letters from brand name (uppercase, alphanumeric only)
  const cleanBrandName = (brandName || "BRAND")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3)
    .padEnd(3, "BRD"); // Pad to 3 chars if shorter

  const brandPrefix = cleanBrandName.slice(0, 3);

  // Generate deterministic "random" numbers from orderId (7 digits)
  // This ensures the same orderId always produces the same tracking ID
  const cleanOrderId = orderId.replace(/[^A-Za-z0-9]/g, "");

  // Create a hash from orderId to generate consistent numbers
  let hash = 0;
  for (let i = 0; i < cleanOrderId.length; i++) {
    hash = (hash * 31 + cleanOrderId.charCodeAt(i)) >>> 0;
  }

  // Convert hash to 7-digit number (ensures it's always 7 digits)
  const numericPart = String(Math.abs(hash) % 10000000).padStart(7, "0");

  const trackingId = `${brandPrefix}${numericPart}`;

  // If maxLength is different, trim or pad accordingly
  if (maxLength !== 10) {
    return trackingId.slice(0, maxLength);
  }

  return trackingId;
}

/**
 * Generate a unique custom order ID for display purposes.
 * Format: First 3 letters of brand name + 7 numeric digits
 * Example: "SID1122343" for Sidwell brand
 *
 * Structure (10 characters total):
 * - 3 characters: Brand prefix (first 3 letters of brand name, uppercase)
 * - 7 digits: Mix of timestamp-based and random numbers
 *
 * This creates professional, memorable order IDs like:
 * - "SHO3924857" (ShoeStore)
 * - "ADI5982143" (Adidas)
 * - "NIK1472536" (Nike)
 */
export function generateCustomOrderId(brandName: string | undefined | null): string {
  // Extract first 3 letters from brand name (uppercase, letters only)
  const cleanBrandName = (brandName || "ORD")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3)
    .padEnd(3, "X"); // Pad with 'X' if shorter

  const brandPrefix = cleanBrandName.slice(0, 3);

  // Create a unique 7-digit suffix using timestamp and random elements
  const timestamp = Date.now();

  // Generate suffix: mix of timestamp-derived and random digits
  let suffix = "";

  // First 3 digits from timestamp (last 3 digits of milliseconds)
  const timeDigits = String(timestamp % 1000).padStart(3, "0");
  suffix += timeDigits;

  // Next 4 digits: random numbers
  for (let i = 0; i < 4; i++) {
    suffix += Math.floor(Math.random() * 10);
  }

  // Return formatted ID without hyphen: BRD1234567
  return `${brandPrefix}${suffix}`;
}

/**
 * Extract brand prefix from a custom order ID
 * Example: "SID1122343" returns "SID"
 */
export function extractBrandPrefix(customOrderId: string): string {
  // Handle both old format (with hyphen) and new format (without hyphen)
  if (customOrderId.includes("-")) {
    return customOrderId.split("-")[0] || "";
  }
  // New format: first 3 characters are the prefix
  return customOrderId.slice(0, 3);
}

/**
 * Validate if a string is a valid custom order ID format
 * Supports both formats:
 * - New format: XXX1234567 (3 letters + 7 digits)
 * - Old format: XXX-XXXXXXX (3 letters, hyphen, 7 alphanumeric)
 */
export function isValidCustomOrderId(id: string): boolean {
  // New format: 3 uppercase letters followed by 7 digits
  if (/^[A-Z]{3}[0-9]{7}$/.test(id)) {
    return true;
  }
  // Old format: 3 uppercase letters, hyphen, 7 alphanumeric
  if (/^[A-Z]{3}-[A-Z0-9]{7}$/.test(id)) {
    return true;
  }
  return false;
}
