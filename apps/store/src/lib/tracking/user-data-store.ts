/**
 * User Data Store for Tracking
 *
 * Persists user data (email, phone, name) in localStorage and cookies
 * to enable better event matching across all tracking events.
 * This improves pixel data quality for Meta, TikTok, and other platforms.
 */

const STORAGE_KEY = "store_user_tracking_data";
const COOKIE_NAME = "_shopuid"; // Shop User ID for external_id
const EXPIRY_DAYS = 180; // 6 months

export interface StoredUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  externalId?: string; // Unique user identifier for cross-session matching
  firstSeenAt?: string;
  lastUpdatedAt?: string;
}

/**
 * Generate a unique external ID for the user
 * This helps Meta match events across sessions even without PII
 */
function generateExternalId(): string {
  // Create a fingerprint-like ID based on available browser data
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth?.toString() || "",
  ];

  // Simple hash function
  let hash = 0;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Add random component for uniqueness
  const random = Math.random().toString(36).substring(2, 10);
  return `u_${Math.abs(hash).toString(36)}_${random}`;
}

/**
 * Get or create external ID and store in cookie
 */
export function getOrCreateExternalId(): string {
  if (typeof document === "undefined") return "";

  // Check cookie first
  const cookies = document.cookie.split("; ");
  const uidCookie = cookies.find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (uidCookie) {
    return uidCookie.split("=")[1];
  }

  // Check localStorage
  const stored = getStoredUserData();
  if (stored?.externalId) {
    // Also set cookie for consistency
    setExternalIdCookie(stored.externalId);
    return stored.externalId;
  }

  // Generate new ID
  const newId = generateExternalId();
  setExternalIdCookie(newId);

  // Store in localStorage too
  storeUserData({ externalId: newId });

  return newId;
}

/**
 * Set external ID cookie
 */
function setExternalIdCookie(id: string): void {
  if (typeof document === "undefined") return;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);
  document.cookie = `${COOKIE_NAME}=${id}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Get stored user data from localStorage
 */
export function getStoredUserData(): StoredUserData | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StoredUserData;
  } catch {
    return null;
  }
}

/**
 * Store user data in localStorage
 * Merges with existing data, only updating non-empty fields
 */
export function storeUserData(data: Partial<StoredUserData>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getStoredUserData() || {};

    // Ensure we have an external ID
    const externalId = existing.externalId || data.externalId || getOrCreateExternalId();

    // Parse full name into first/last if provided
    let firstName = data.firstName || existing.firstName;
    let lastName = data.lastName || existing.lastName;

    if (data.fullName && !firstName && !lastName) {
      const nameParts = data.fullName.trim().split(" ");
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
    }

    const updated: StoredUserData = {
      ...existing,
      ...(data.email && { email: data.email }),
      ...(data.phone && { phone: data.phone }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(data.fullName && { fullName: data.fullName }),
      ...(data.city && { city: data.city }),
      ...(data.postalCode && { postalCode: data.postalCode }),
      ...(data.country && { country: data.country }),
      externalId,
      firstSeenAt: existing.firstSeenAt || new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail
  }
}

/**
 * Get user data formatted for Meta Pixel tracking
 * Returns all available user data for better event matching
 */
export function getUserDataForTracking(): {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  externalId?: string;
} {
  if (typeof window === "undefined") return {};

  const stored = getStoredUserData();
  const externalId = getOrCreateExternalId();

  return {
    ...(stored?.email && { email: stored.email }),
    ...(stored?.phone && { phone: stored.phone }),
    ...(stored?.firstName && { firstName: stored.firstName }),
    ...(stored?.lastName && { lastName: stored.lastName }),
    ...(stored?.city && { city: stored.city }),
    ...(stored?.postalCode && { zipCode: stored.postalCode }),
    ...(stored?.country && { country: stored.country }),
    externalId,
  };
}

/**
 * Clear stored user data (for logout, etc.)
 */
export function clearUserData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if we have sufficient user data for good matching
 */
export function hasGoodUserData(): boolean {
  const data = getStoredUserData();
  if (!data) return false;

  // Consider "good" if we have at least email OR phone
  return !!(data.email || data.phone);
}
