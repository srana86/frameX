/**
 * Tenant Resolver - Server-side tenant resolution with Redis caching
 * Used by server components and API routes
 */

import { prisma, getTenantByDomain } from "@framex/database";
import { headers } from "next/headers";
import Redis from "ioredis";

// Redis client (optional - falls back to in-memory if not available)
let redis: Redis | null = null;

try {
    if (process.env.REDIS_URL) {
        redis = new Redis(process.env.REDIS_URL);
    }
} catch (error) {
    console.warn("Redis not available, using in-memory cache");
}

// In-memory fallback cache
const memoryCache = new Map<string, { tenantId: string; data: any; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get tenant from cache (Redis or memory)
 */
async function getTenantFromCache(key: string): Promise<any | null> {
    // Try Redis first
    if (redis) {
        const cached = await redis.get(`tenant:${key}`);
        if (cached) {
            return JSON.parse(cached);
        }
    }

    // Fallback to memory
    const memCached = memoryCache.get(key);
    if (memCached && memCached.expiresAt > Date.now()) {
        return memCached.data;
    }

    return null;
}

/**
 * Set tenant in cache
 */
async function setTenantCache(key: string, data: any): Promise<void> {
    // Set in Redis
    if (redis) {
        await redis.setex(`tenant:${key}`, 300, JSON.stringify(data));
    }

    // Also set in memory
    memoryCache.set(key, {
        tenantId: data.tenantId,
        data,
        expiresAt: Date.now() + CACHE_TTL,
    });
}

/**
 * Resolve tenant from request context
 * Priority: x-merchant-id > x-subdomain > x-domain > lookup
 */
export async function resolveTenant(): Promise<{
    tenantId: string;
    tenant?: any;
} | null> {
    const headersList = await headers();

    // Priority 1: Direct merchant ID (from env or cache hit in proxy)
    const merchantId = headersList.get("x-merchant-id");
    if (merchantId) {
        return { tenantId: merchantId };
    }

    // Priority 2: Subdomain header
    const subdomain = headersList.get("x-subdomain");
    if (subdomain) {
        // Check cache
        const cached = await getTenantFromCache(`subdomain:${subdomain}`);
        if (cached) {
            return cached;
        }

        // Database lookup
        const domain = await getTenantByDomain(`${subdomain}.framextech.com`);
        if (domain) {
            const result = { tenantId: domain.tenantId, tenant: domain.tenant };
            await setTenantCache(`subdomain:${subdomain}`, result);
            return result;
        }
    }

    // Priority 3: Custom domain header
    const customDomain = headersList.get("x-domain");
    if (customDomain) {
        // Check cache
        const cached = await getTenantFromCache(`domain:${customDomain}`);
        if (cached) {
            return cached;
        }

        // Database lookup
        const domain = await getTenantByDomain(customDomain);
        if (domain) {
            const result = { tenantId: domain.tenantId, tenant: domain.tenant };
            await setTenantCache(`domain:${customDomain}`, result);
            return result;
        }
    }

    return null;
}

/**
 * Invalidate tenant cache (call when domain changes)
 */
export async function invalidateTenantCache(
    subdomain?: string,
    customDomain?: string
): Promise<void> {
    if (subdomain) {
        if (redis) await redis.del(`tenant:subdomain:${subdomain}`);
        memoryCache.delete(`subdomain:${subdomain}`);
    }

    if (customDomain) {
        if (redis) await redis.del(`tenant:domain:${customDomain}`);
        memoryCache.delete(`domain:${customDomain}`);
    }
}
