// Polyfill fetch for sslcommerz-lts library
// This ensures fetch is available globally before the library is imported

// Always ensure fetch is available, even if it exists
// The library might check for it in a way that doesn't work with Next.js's fetch

// First, try to use the built-in fetch from Next.js/Node.js
if (typeof fetch !== "undefined") {
  // Make sure it's on globalThis and global
  if (typeof globalThis !== "undefined" && typeof globalThis.fetch === "undefined") {
    globalThis.fetch = fetch;
  }
  if (typeof global !== "undefined" && typeof (global as any).fetch === "undefined") {
    (global as any).fetch = fetch;
  }
  // Also ensure it's available as a direct reference
  if (typeof (globalThis as any).fetch === "undefined") {
    (globalThis as any).fetch = fetch;
  }
} else {
  // Fallback: use node-fetch if available
  try {
    const nodeFetch = require("node-fetch");
    const fetchImpl = nodeFetch.default || nodeFetch;

    // Set on all possible global objects
    if (typeof globalThis !== "undefined") {
      globalThis.fetch = fetchImpl;
    }
    if (typeof global !== "undefined") {
      (global as any).fetch = fetchImpl;
    }
    if (typeof window !== "undefined") {
      (window as any).fetch = fetchImpl;
    }
  } catch (e) {
    console.error("Failed to load fetch polyfill:", e);
  }
}
