// In-memory store for active viewers
// Format: { [productSlug]: Map<sessionId, lastActiveAt> }
const activeViewers = new Map<string, Map<string, Date>>();

// Cleanup inactive viewers (older than 30 seconds)
const cleanupInactiveViewers = () => {
  const now = new Date();
  const inactiveThreshold = 30 * 1000; // 30 seconds

  for (const [slug, viewers] of activeViewers.entries()) {
    for (const [sessionId, lastActive] of viewers.entries()) {
      if (now.getTime() - lastActive.getTime() > inactiveThreshold) {
        viewers.delete(sessionId);
      }
    }
    if (viewers.size === 0) {
      activeViewers.delete(slug);
    }
  }
};

// Run cleanup every 10 seconds
setInterval(cleanupInactiveViewers, 10000);

// Track product viewer
const trackProductViewerFromDB = async (
  productSlug: string,
  sessionId?: string
) => {
  if (!productSlug) {
    throw new Error("Product slug is required");
  }

  const viewerId =
    sessionId ||
    `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  if (!activeViewers.has(productSlug)) {
    activeViewers.set(productSlug, new Map());
  }

  const viewers = activeViewers.get(productSlug)!;
  viewers.set(viewerId, new Date());

  return {
    count: viewers.size,
    sessionId: viewerId,
  };
};

// Get viewer count
const getProductViewerCountFromDB = async (productSlug: string) => {
  if (!productSlug) {
    throw new Error("Product slug is required");
  }

  const viewers = activeViewers.get(productSlug);
  return {
    count: viewers?.size || 0,
  };
};

// Remove viewer
const removeProductViewerFromDB = async (
  productSlug: string,
  sessionId: string
) => {
  if (!productSlug || !sessionId) {
    throw new Error("Product slug and session ID are required");
  }

  const viewers = activeViewers.get(productSlug);
  if (viewers) {
    viewers.delete(sessionId);
    if (viewers.size === 0) {
      activeViewers.delete(productSlug);
    }
  }

  return {
    count: activeViewers.get(productSlug)?.size || 0,
  };
};

export const ProductViewersServices = {
  trackProductViewerFromDB,
  getProductViewerCountFromDB,
  removeProductViewerFromDB,
};
