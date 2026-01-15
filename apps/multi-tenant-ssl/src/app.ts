// =============================================================================
// Express Application Setup
// =============================================================================
// Main Express app configuration with security middleware, routes, and error handling.
// This is the API server for managing tenant domains and SSL certificates.
// =============================================================================

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma as prismaClient, PrismaClient } from '@framex/database';
export { prisma as prismaClient } from '@framex/database';
export const prisma: PrismaClient = prismaClient;
import pino from 'pino';

import { config } from './config';
import { domainsRouter } from './routes/domains';
import { tenantsRouter } from './routes/tenants';
import { certificatesRouter } from './routes/certificates';
import { healthRouter } from './routes/health';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { ApiResponse } from './types';

// =============================================================================
// LOGGER SETUP
// =============================================================================
// Using Pino for high-performance structured logging
// =============================================================================

export const logger = pino({
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    transport: config.nodeEnv !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
});



// =============================================================================
// EXPRESS APP FACTORY
// =============================================================================
// Creates and configures the Express application
// =============================================================================

export function createApp(): Application {
    const app = express();

    // ---------------------------------------------------------------------------
    // SECURITY MIDDLEWARE
    // ---------------------------------------------------------------------------

    // Helmet: Sets various HTTP headers for security
    // - X-Content-Type-Options: nosniff
    // - X-Frame-Options: DENY
    // - X-XSS-Protection: 0 (modern browsers don't need this)
    // - Strict-Transport-Security: max-age=15552000 (180 days)
    app.use(helmet({
        contentSecurityPolicy: false,  // We're an API, not serving HTML
        crossOriginEmbedderPolicy: false,
    }));

    // CORS: Configure cross-origin resource sharing
    // In production, restrict to specific origins
    app.use(cors({
        origin: config.nodeEnv === 'production'
            ? (origin, callback) => {
                // In production, you'd check against allowed origins
                callback(null, true);
            }
            : '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        credentials: true,
    }));

    // ---------------------------------------------------------------------------
    // RATE LIMITING
    // ---------------------------------------------------------------------------
    // Protect against brute force and DDoS attacks

    // General rate limit: 100 requests per minute
    const generalLimiter = rateLimit({
        windowMs: 60 * 1000,  // 1 minute
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            error: 'Too many requests, please try again later'
        } as ApiResponse,
    });

    // Strict limit for sensitive operations: 10 requests per minute
    const strictLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            error: 'Rate limit exceeded for this operation'
        } as ApiResponse,
    });

    // Apply general rate limiting to all routes
    app.use(generalLimiter);

    // ---------------------------------------------------------------------------
    // BODY PARSING
    // ---------------------------------------------------------------------------

    app.use(express.json({ limit: '10kb' }));  // Limit payload size
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    // ---------------------------------------------------------------------------
    // REQUEST LOGGING
    // ---------------------------------------------------------------------------

    app.use((req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - startTime;
            logger.info({
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userAgent: req.get('user-agent'),
            });
        });

        next();
    });

    // ---------------------------------------------------------------------------
    // HEALTH CHECK ROUTES (No auth required)
    // ---------------------------------------------------------------------------

    app.use('/health', healthRouter);

    // ---------------------------------------------------------------------------
    // API ROUTES (Auth required)
    // ---------------------------------------------------------------------------

    // All /api routes require authentication
    app.use('/api/v1', authMiddleware);

    // Domain management endpoints
    app.use('/api/v1/domains', domainsRouter);

    // Tenant management endpoints
    app.use('/api/v1/tenants', tenantsRouter);

    // Certificate management endpoints (strict rate limit)
    app.use('/api/v1/certificates', strictLimiter, certificatesRouter);

    // ---------------------------------------------------------------------------
    // SPECIAL ENDPOINTS
    // ---------------------------------------------------------------------------

    // Domain ownership verification endpoint (for on-demand TLS)
    // This is called by the reverse proxy to verify if a domain is valid
    // No auth required - must be fast and reliable
    app.get('/api/v1/domains/verify-ownership', async (req: Request, res: Response) => {
        const domain = req.query.domain as string;

        if (!domain) {
            return res.status(400).json({
                success: false,
                error: 'Domain parameter required'
            });
        }

        try {
            const domainRecord = await prisma.tenantDomain.findFirst({
                where: {
                    hostname: domain,
                    status: 'ACTIVE',
                    deletedAt: null,
                },
            });

            if (domainRecord) {
                // Domain is valid and active - allow SSL issuance
                return res.status(200).json({ success: true });
            } else {
                // Domain not found or not active
                return res.status(404).json({
                    success: false,
                    error: 'Domain not found or not active'
                });
            }
        } catch (error) {
            logger.error({ error, domain }, 'Error verifying domain ownership');
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    });

    // ---------------------------------------------------------------------------
    // 404 HANDLER
    // ---------------------------------------------------------------------------

    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            error: 'Not found',
            message: `Cannot ${req.method} ${req.path}`,
        } as ApiResponse);
    });

    // ---------------------------------------------------------------------------
    // ERROR HANDLER
    // ---------------------------------------------------------------------------

    app.use(errorHandler);

    return app;
}
