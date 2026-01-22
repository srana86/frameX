/**
 * Meta Pixel Implementation with Parameter Builder SDK Integration
 *
 * This script integrates Meta's official clientParamBuilder SDK for improved
 * Conversions API event quality. It properly manages:
 * - Meta click ID (fbc)
 * - Meta browser ID (fbp)
 * - Client IP Address (client_ip_address)
 * - PII normalization and hashing
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/parameter-builder-library
 */

const PIXEL_ID = document.currentScript.getAttribute("data-pixel-id");

/**
 * Initialize Facebook Pixel base code
 */
function initializeFacebookPixel(f, b, e, v, n, t, s) {
  if (f.fbq) return;
  n = f.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = !0;
  n.version = "2.0";
  n.queue = [];
  t = b.createElement(e);
  t.async = !0;
  t.src = v;
  s = b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t, s);
}

/**
 * Load Meta's clientParamBuilder SDK
 */
function loadClientParamBuilder() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.clientParamBuilder) {
      resolve(window.clientParamBuilder);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://capi-automation.s3.us-east-2.amazonaws.com/public/client_js/capiParamBuilder/clientParamBuilder.bundle.js";
    script.async = true;
    script.onload = () => {
      if (window.clientParamBuilder) {
        console.log("[Meta Pixel] clientParamBuilder SDK loaded successfully");
        resolve(window.clientParamBuilder);
      } else {
        reject(new Error("clientParamBuilder not available after script load"));
      }
    };
    script.onerror = () => {
      console.warn("[Meta Pixel] Failed to load clientParamBuilder SDK, using fallback");
      reject(new Error("Failed to load clientParamBuilder SDK"));
    };
    document.head.appendChild(script);
  });
}

/**
 * Get client IP address (IPv6 preferred, fallback to IPv4)
 */
async function getClientIpAddress() {
  try {
    // Try to get IPv6 first
    const response = await fetch("https://api64.ipify.org?format=text", {
      cache: "no-store",
    });
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {
    // Fallback to IPv4
    try {
      const response = await fetch("https://api.ipify.org?format=text", {
        cache: "no-store",
      });
      if (response.ok) {
        return await response.text();
      }
    } catch {
      // Silently fail
    }
  }
  return "";
}

/**
 * Fallback: Capture fbclid from URL and set _fbc cookie for better tracking
 * Used when clientParamBuilder SDK is not available
 */
function captureFbclidToCookie() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get("fbclid");

    if (fbclid) {
      // Check if _fbc cookie already exists and is valid
      const existingFbc = getCookieValue("_fbc");
      if (existingFbc && existingFbc.includes(fbclid)) {
        return; // Already have this fbclid
      }

      // Format: fb.1.{timestamp}.{fbclid}
      const timestamp = Math.floor(Date.now() / 1000);
      const fbcValue = `fb.1.${timestamp}.${fbclid}`;

      // Set cookie with 90 days expiry (standard for Meta)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);

      // Set _fbc cookie on root domain for cross-subdomain tracking
      const domain = getTopLevelDomain();
      const domainPart = domain ? `; domain=${domain}` : "";
      document.cookie = `_fbc=${fbcValue}; expires=${expiryDate.toUTCString()}; path=/${domainPart}; SameSite=Lax`;

      console.log("[Meta Pixel] Captured fbclid and set _fbc cookie:", fbcValue);
    }
  } catch (e) {
    console.error("[Meta Pixel] Error capturing fbclid:", e);
  }
}

/**
 * Get top-level domain for cookie setting
 */
function getTopLevelDomain() {
  try {
    const hostname = window.location.hostname;
    // Handle localhost
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return null;
    }
    // Handle IP addresses
    if (/^[\d.]+$/.test(hostname)) {
      return null;
    }
    // Get top-level domain (e.g., example.com from www.example.com)
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return "." + parts.slice(-2).join(".");
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get cookie value helper
 */
function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
  return "";
}

/**
 * Get stored user data for Advanced Matching
 * This improves event matching quality significantly
 */
function getStoredUserDataForAdvancedMatching() {
  try {
    const stored = localStorage.getItem("store_user_tracking_data");
    if (!stored) return {};

    const data = JSON.parse(stored);
    const advancedMatchingData = {};

    // Map stored data to Meta's advanced matching parameters
    if (data.email) advancedMatchingData.em = data.email;
    if (data.phone) advancedMatchingData.ph = data.phone.replace(/\D/g, ""); // Remove non-digits
    if (data.firstName) advancedMatchingData.fn = data.firstName;
    if (data.lastName) advancedMatchingData.ln = data.lastName;
    if (data.city) advancedMatchingData.ct = data.city;
    if (data.postalCode) advancedMatchingData.zp = data.postalCode;
    if (data.country) advancedMatchingData.country = data.country;
    if (data.externalId) advancedMatchingData.external_id = data.externalId;

    return advancedMatchingData;
  } catch (e) {
    return {};
  }
}

/**
 * Add noscript IMG fallback for users with JS disabled
 */
function addNoscriptFallback() {
  try {
    // Check if noscript already exists
    if (document.querySelector("noscript[data-fb-pixel]")) return;

    const noscript = document.createElement("noscript");
    noscript.setAttribute("data-fb-pixel", "true");
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1" alt="" />`;
    document.body.appendChild(noscript);
  } catch (e) {
    // Silently fail
  }
}

/**
 * Initialize Meta tracking with clientParamBuilder SDK
 */
async function initializeMetaTracking() {
  try {
    // Load the clientParamBuilder SDK
    const builder = await loadClientParamBuilder();

    // Process and collect all parameters (fbc, fbp, client_ip_address)
    const cookies = await builder.processAndCollectAllParams(window.location.href, getClientIpAddress);

    console.log("[Meta Pixel] Parameters collected via SDK:", {
      fbc: cookies._fbc ? "present" : "missing",
      fbp: cookies._fbp ? "present" : "missing",
      clientIpAddress: cookies._fbi ? "present" : "missing",
    });

    // Emit custom event for other scripts to know params are ready
    window.dispatchEvent(
      new CustomEvent("metaParamsReady", {
        detail: {
          fbc: cookies._fbc || "",
          fbp: cookies._fbp || "",
          clientIpAddress: cookies._fbi || "",
        },
      })
    );

    return cookies;
  } catch (error) {
    console.warn("[Meta Pixel] SDK initialization failed, using fallback:", error);
    // Fallback: manual fbclid capture
    captureFbclidToCookie();
    return null;
  }
}

// ============================================
// INITIALIZATION
// ============================================

// Load Facebook Pixel SDK first
initializeFacebookPixel(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

// Get stored user data for advanced matching
const advancedMatchingData = getStoredUserDataForAdvancedMatching();

// Initialize pixel with Advanced Matching data if available
if (Object.keys(advancedMatchingData).length > 0) {
  window.fbq("init", PIXEL_ID, advancedMatchingData, { autoConfig: true, debug: false });
  console.log("[Meta Pixel] Initialized with Advanced Matching data:", Object.keys(advancedMatchingData));
} else {
  window.fbq("init", PIXEL_ID, {}, { autoConfig: true, debug: false });
}

// Enable automatic button click tracking
window.fbq("set", "autoConfig", true, PIXEL_ID);

// Fire initial PageView event immediately
window.fbq("track", "PageView");

// Initialize Meta Parameter Builder SDK (async, non-blocking)
initializeMetaTracking();

// Add noscript fallback after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addNoscriptFallback);
} else {
  addNoscriptFallback();
}
