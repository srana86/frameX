// =============================================================================
// Health Check Routes
// =============================================================================
// Provides health check endpoints for load balancers and monitoring systems.
// These endpoints are public (no authentication required).
// =============================================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../app';
import { HealthCheckResult } from '../types';
import Redis from 'ioredis';
import { config } from '../config';

export const healthRouter: Router = Router();

// =============================================================================
// BASIC HEALTH CHECK
// =============================================================================
// Simple endpoint that returns 200 if the service is running.
// Used by load balancers for basic up/down checks.
// =============================================================================

healthRouter.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'multi-tenant-ssl',
        version: process.env.npm_package_version || '1.0.0',
    });
});

// =============================================================================
// LIVENESS PROBE
// =============================================================================
// Kubernetes liveness probe - indicates if the process is running.
// If this fails, Kubernetes will restart the container.
// =============================================================================

healthRouter.get('/live', (req: Request, res: Response) => {
    res.status(200).json({ status: 'alive' });
});

// =============================================================================
// READINESS PROBE
// =============================================================================
// Kubernetes readiness probe - indicates if the service can accept traffic.
// Checks database and Redis connectivity before reporting ready.
// =============================================================================

healthRouter.get('/ready', async (req: Request, res: Response) => {
    const checks: HealthCheckResult[] = [];
    let isReady = true;

    // ---------------------------------------------------------------------------
    // Database Check
    // ---------------------------------------------------------------------------
    try {
        const startTime = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const latency = Date.now() - startTime;

        checks.push({
            service: 'database',
            status: 'healthy',
            latency,
        });
    } catch (error) {
        isReady = false;
        checks.push({
            service: 'database',
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }

    // ---------------------------------------------------------------------------
    // Redis Check
    // ---------------------------------------------------------------------------
    try {
        const redis = new Redis(config.redisUrl, {
            maxRetriesPerRequest: 1,
            lazyConnect: true,
        });

        const startTime = Date.now();
        await redis.ping();
        const latency = Date.now() - startTime;
        await redis.quit();

        checks.push({
            service: 'redis',
            status: 'healthy',
            latency,
        });
    } catch (error) {
        // Redis is optional for basic functionality
        checks.push({
            service: 'redis',
            status: 'degraded',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }

    // ---------------------------------------------------------------------------
    // Response
    // ---------------------------------------------------------------------------
    const status = isReady ? 200 : 503;
    res.status(status).json({
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks,
    });
});

// =============================================================================
// DETAILED HEALTH CHECK
// =============================================================================
// Comprehensive health check with system metrics.
// Useful for debugging and monitoring dashboards.
// =============================================================================

healthRouter.get('/detailed', async (req: Request, res: Response) => {
    const checks: HealthCheckResult[] = [];

    // ---------------------------------------------------------------------------
    // Database Check with Details
    // ---------------------------------------------------------------------------
    try {
        const startTime = Date.now();
        const [dbResult] = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Domain" WHERE "deletedAt" IS NULL
    `;
        const latency = Date.now() - startTime;

        checks.push({
            service: 'database',
            status: 'healthy',
            latency,
            details: {
                activeDomains: Number(dbResult.count),
            },
        });
    } catch (error) {
        checks.push({
            service: 'database',
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }

    // ---------------------------------------------------------------------------
    // Certificate Summary
    // ---------------------------------------------------------------------------
    try {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const [certStats] = await prisma.$queryRaw<[{
            total: bigint;
            expiring_soon: bigint;
            expired: bigint;
        }]>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "certExpiresAt" < ${thirtyDaysFromNow} AND "certExpiresAt" > ${now}) as expiring_soon,
        COUNT(*) FILTER (WHERE "certExpiresAt" < ${now}) as expired
      FROM "Domain"
      WHERE "deletedAt" IS NULL AND "sslStatus" = 'ACTIVE'
    `;

        checks.push({
            service: 'certificates',
            status: Number(certStats.expired) > 0 ? 'degraded' : 'healthy',
            details: {
                total: Number(certStats.total),
                expiringSoon: Number(certStats.expiring_soon),
                expired: Number(certStats.expired),
            },
        });
    } catch (error) {
        checks.push({
            service: 'certificates',
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }

    // ---------------------------------------------------------------------------
    // System Metrics
    // ---------------------------------------------------------------------------
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'multi-tenant-ssl',
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
        uptime: {
            seconds: Math.floor(uptime),
            human: formatUptime(uptime),
        },
        memory: {
            heapUsed: formatBytes(memoryUsage.heapUsed),
            heapTotal: formatBytes(memoryUsage.heapTotal),
            rss: formatBytes(memoryUsage.rss),
        },
        checks,
    });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatBytes(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (parts.length === 0) parts.push(`${Math.floor(seconds)}s`);

    return parts.join(' ');
}
