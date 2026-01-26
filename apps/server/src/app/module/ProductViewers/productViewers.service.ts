// In-memory store for active viewers
// Format: { [tenantId]: { [productSlug]: Map<sessionId, lastActiveAt> } }
const activeViewers = new Map<string, Map<string, Map<string, Date>>>();

// Cleanup inactive viewers (older than 30 seconds)
const cleanupInactiveViewers = () => {
  const now = new Date();
  const inactiveThreshold = 30 * 1000; // 30 seconds

  for (const [tenantId, tenantProducts] of activeViewers.entries()) {
    for (const [slug, viewers] of tenantProducts.entries()) {
      for (const [sessionId, lastActive] of viewers.entries()) {
        if (now.getTime() - lastActive.getTime() > inactiveThreshold) {
          viewers.delete(sessionId);
        }
      }
      if (viewers.size === 0) {
        tenantProducts.delete(slug);
      }
    }
    if (tenantProducts.size === 0) {
      activeViewers.delete(tenantId);
    }
  }
};

// Run cleanup every 10 seconds
setInterval(cleanupInactiveViewers, 10000);

// Track product viewer
const trackProductViewerFromDB = async (
  tenantId: string,
  productSlug: string,
  sessionId?: string | null
) => {
  if (!tenantId || !productSlug) {
    throw new Error("Tenant ID and Product slug are required");
  }

  const viewerId =
    sessionId ||
    `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  if (!activeViewers.has(tenantId)) {
    activeViewers.set(tenantId, new Map());
  }

  const tenantProducts = activeViewers.get(tenantId)!;

  if (!tenantProducts.has(productSlug)) {
    tenantProducts.set(productSlug, new Map());
  }

  const viewers = tenantProducts.get(productSlug)!;
  viewers.set(viewerId, new Date());

  return {
    count: viewers.size,
    sessionId: viewerId,
  };
};

// Get viewer count
const getProductViewerCountFromDB = async (tenantId: string, productSlug: string) => {
  if (!tenantId || !productSlug) {
    throw new Error("Tenant ID and Product slug are required");
  }

  const tenantProducts = activeViewers.get(tenantId);
  const viewers = tenantProducts?.get(productSlug);

  return {
    count: viewers?.size || 0,
  };
};

// Remove viewer
const removeProductViewerFromDB = async (
  tenantId: string,
  productSlug: string,
  sessionId: string
) => {
  if (!tenantId || !productSlug || !sessionId) {
    throw new Error("Tenant ID, Product slug and session ID are required");
  }

  const tenantProducts = activeViewers.get(tenantId);
  if (tenantProducts) {
    const viewers = tenantProducts.get(productSlug);
    if (viewers) {
      viewers.delete(sessionId);
      if (viewers.size === 0) {
        tenantProducts.delete(productSlug);
      }
    }
    if (tenantProducts.size === 0) {
      activeViewers.delete(tenantId);
    }
  }

  // Return current count after removal
  const currentCount = activeViewers.get(tenantId)?.get(productSlug)?.size || 0;

  return {
    count: currentCount,
  };
};

export const ProductViewersServices = {
  trackProductViewerFromDB,
  getProductViewerCountFromDB,
  removeProductViewerFromDB,
};
