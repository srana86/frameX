import { revalidateTag, revalidatePath } from "next/cache";
import { unstable_cache } from "next/cache";

/**
 * Cache tags for granular revalidation
 */
export const CACHE_TAGS = {
  PRODUCTS: "products",
  PRODUCT: (id: string) => `product-${id}`,
  BRAND_CONFIG: "brand-config",
  ORDERS: "orders",
  ORDER: (id: string) => `order-${id}`,
  COUPONS: "coupons",
  COUPON: (id: string) => `coupon-${id}`,
  DELIVERY_CONFIG: "delivery-config",
  HERO_SLIDES: "hero-slides",
  BLOCKED_CUSTOMERS: "blocked-customers",
  CATEGORIES: "categories",
  INVENTORY: "inventory",
  STATISTICS: "statistics",
} as const;

/**
 * Revalidate cache tags after mutations
 */
export async function revalidateCache(tags: string[]) {
  try {
    await Promise.all(tags.map((tag) => revalidateTag(tag, {})));
  } catch (error) {
    console.error("Error revalidating cache:", error);
  }
}

/**
 * Revalidate paths after mutations
 */
export async function revalidatePaths(paths: string[]) {
  try {
    await Promise.all(paths.map((path) => revalidatePath(path)));
  } catch (error) {
    console.error("Error revalidating paths:", error);
  }
}

/**
 * Create a cached function with tags for revalidation
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyParts: string[],
  options: {
    tags: string[];
    revalidate?: number;
  }
): T {
  const cacheKey = keyParts.join("-");
  return unstable_cache(fn, [cacheKey], {
    tags: options.tags,
    revalidate: options.revalidate,
  }) as T;
}

/**
 * Cache control headers for different data types
 */
export const CACHE_HEADERS = {
  // Static data that rarely changes (brand config, categories)
  STATIC: {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
  },
  // Semi-static data (products, hero slides)
  SEMI_STATIC: {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  },
  // Dynamic data (orders, inventory)
  DYNAMIC: {
    "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
  },
  // Real-time data (no cache)
  REALTIME: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
} as const;
