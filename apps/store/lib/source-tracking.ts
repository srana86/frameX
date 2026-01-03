/**
 * Source Tracking Utility
 * 
 * Captures and persists URL parameters (fbclid, UTM parameters, etc.) 
 * across page navigations using localStorage.
 */

export interface SourceTrackingData {
  // Facebook Click ID
  fbclid?: string;
  
  // UTM Parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  
  // Other tracking parameters
  gclid?: string; // Google Click ID
  ref?: string; // Referrer
  
  // Timestamp when first captured
  firstSeenAt?: string;
  
  // Landing page URL
  landingPage?: string;
}

const STORAGE_KEY = 'shoestore_source_tracking';
const EXPIRY_DAYS = 30; // Keep tracking data for 30 days

/**
 * Get stored source tracking data from localStorage
 */
export function getStoredSourceTracking(): SourceTrackingData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored) as SourceTrackingData & { expiresAt?: string };
    
    // Check if expired
    if (data.expiresAt) {
      const expiryDate = new Date(data.expiresAt);
      if (new Date() > expiryDate) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    }
    
    return data;
  } catch (error) {
    console.error('[Source Tracking] Error reading stored data:', error);
    return null;
  }
}

/**
 * Extract tracking parameters from URL
 */
export function extractSourceTrackingFromUrl(url?: string): Partial<SourceTrackingData> {
  if (typeof window === 'undefined') return {};
  
  const urlToParse = url || window.location.href;
  const urlObj = new URL(urlToParse);
  const params = urlObj.searchParams;
  
  const tracking: Partial<SourceTrackingData> = {};
  
  // Facebook Click ID
  if (params.has('fbclid')) {
    tracking.fbclid = params.get('fbclid') || undefined;
  }
  
  // UTM Parameters
  if (params.has('utm_source')) {
    tracking.utm_source = params.get('utm_source') || undefined;
  }
  if (params.has('utm_medium')) {
    tracking.utm_medium = params.get('utm_medium') || undefined;
  }
  if (params.has('utm_campaign')) {
    tracking.utm_campaign = params.get('utm_campaign') || undefined;
  }
  if (params.has('utm_term')) {
    tracking.utm_term = params.get('utm_term') || undefined;
  }
  if (params.has('utm_content')) {
    tracking.utm_content = params.get('utm_content') || undefined;
  }
  
  // Google Click ID
  if (params.has('gclid')) {
    tracking.gclid = params.get('gclid') || undefined;
  }
  
  // Referrer
  if (params.has('ref')) {
    tracking.ref = params.get('ref') || undefined;
  }
  
  return tracking;
}

/**
 * Store source tracking data in localStorage
 */
export function storeSourceTracking(data: SourceTrackingData): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getStoredSourceTracking();
    
    // If we already have data, only update if new data has tracking parameters
    // This ensures we keep the first visit's tracking data
    if (existing) {
      const hasNewTracking = data.fbclid || data.utm_source || data.gclid;
      if (!hasNewTracking) {
        // No new tracking data, keep existing
        return;
      }
      
      // Merge: prefer existing firstSeenAt and landingPage, but update tracking params
      const merged: SourceTrackingData & { expiresAt: string } = {
        ...existing,
        ...data,
        firstSeenAt: existing.firstSeenAt || data.firstSeenAt,
        landingPage: existing.landingPage || data.landingPage,
        expiresAt: new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return;
    }
    
    // New data - store with expiry
    const toStore: SourceTrackingData & { expiresAt: string } = {
      ...data,
      firstSeenAt: data.firstSeenAt || new Date().toISOString(),
      landingPage: data.landingPage || window.location.href,
      expiresAt: new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('[Source Tracking] Error storing data:', error);
  }
}

/**
 * Capture and store source tracking from current URL
 */
export function captureSourceTracking(): SourceTrackingData | null {
  if (typeof window === 'undefined') return null;
  
  const urlTracking = extractSourceTrackingFromUrl();
  const hasTrackingParams = Object.keys(urlTracking).length > 0;
  
  if (hasTrackingParams) {
    const trackingData: SourceTrackingData = {
      ...urlTracking,
      firstSeenAt: new Date().toISOString(),
      landingPage: window.location.href,
    };
    
    storeSourceTracking(trackingData);
    return trackingData;
  }
  
  // Return existing stored data even if no new params
  return getStoredSourceTracking();
}

/**
 * Get source tracking data for API requests (returns stored or current)
 */
export function getSourceTrackingForOrder(): SourceTrackingData | null {
  if (typeof window === 'undefined') return null;
  
  // First try to capture any new tracking params from URL
  const current = captureSourceTracking();
  
  // Return stored data (which may include newly captured data)
  return getStoredSourceTracking();
}

/**
 * Clear stored source tracking data
 */
export function clearSourceTracking(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}























