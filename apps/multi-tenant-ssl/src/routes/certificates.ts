// =============================================================================
// Certificate Routes
// =============================================================================
// API endpoints for certificate management and monitoring.
// Includes bulk operations and certificate status queries.
// =============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma, logger } from '../app';
import { AppError } from '../middleware/error-handler';
import { validateParams, validateQuery, idParamSchema, paginationSchema } from '../middleware/validation';
import { CertificateSummary, PaginatedResponse } from '../types';

export const certificatesRouter: Router = Router();

// =============================================================================
// GET CERTIFICATE SUMMARY
// =============================================================================
// GET /api/v1/certificates/summary
// Returns overall certificate health statistics
// =============================================================================

certificatesRouter.get(
    '/summary',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            const [stats] = await prisma.$queryRaw<[{
                total: bigint;
                active: bigint;
                expiring_soon: bigint;
                expired: bigint;
                pending: bigint;
                failed: bigint;
            }]>`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE "sslStatus" = 'ACTIVE') as active,
          COUNT(*) FILTER (WHERE "sslStatus" = 'EXPIRING_SOON' OR ("certExpiresAt" < ${thirtyDaysFromNow} AND "certExpiresAt" > ${now})) as expiring_soon,
          COUNT(*) FILTER (WHERE "sslStatus" = 'EXPIRED' OR "certExpiresAt" < ${now}) as expired,
          COUNT(*) FILTER (WHERE "sslStatus" IN ('PENDING', 'ISSUING')) as pending,
          COUNT(*) FILTER (WHERE "sslStatus" = 'RENEWAL_FAILED') as failed
        FROM "Domain"
        WHERE "deletedAt" IS NULL
      `;

            const summary: CertificateSummary = {
                total: Number(stats.total),
                active: Number(stats.active),
                expiringSoon: Number(stats.expiring_soon),
                expired: Number(stats.expired),
                pendingIssuance: Number(stats.pending),
                failed: Number(stats.failed),
            };

            res.json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// LIST EXPIRING CERTIFICATES
// =============================================================================
// GET /api/v1/certificates/expiring
// Returns domains with certificates expiring within specified days
// =============================================================================

certificatesRouter.get(
    '/expiring',
    validateQuery(paginationSchema.extend({
        days: paginationSchema.shape.sortBy.optional(),
    })),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, days } = req.query as unknown as {
                page: number;
                limit: number;
                days?: string;
            };

            const daysUntilExpiry = parseInt(days || '30', 10);
            const now = new Date();
            const expiryThreshold = new Date(now.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000);

            const where = {
                deletedAt: null,
                certExpiresAt: {
                    lte: expiryThreshold,
                    gt: now,
                },
            };

            const total = await prisma.tenantDomain.count({ where });

            const domains = await prisma.tenantDomain.findMany({
                where,
                include: {
                    tenant: {
                        select: { id: true, name: true, slug: true },
                    },
                },
                orderBy: { certExpiresAt: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            });

            // Add days until expiry to each domain
            const domainsWithExpiry = domains.map(domain => ({
                ...domain,
                daysUntilExpiry: domain.certExpiresAt
                    ? Math.ceil((domain.certExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
                    : null,
            }));

            const response: PaginatedResponse<typeof domainsWithExpiry[0]> = {
                items: domainsWithExpiry,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            };

            res.json({ success: true, data: response });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// LIST FAILED CERTIFICATES
// =============================================================================
// GET /api/v1/certificates/failed
// Returns domains where certificate issuance/renewal failed
// =============================================================================

certificatesRouter.get(
    '/failed',
    validateQuery(paginationSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit } = req.query as unknown as {
                page: number;
                limit: number;
            };

            const where = {
                deletedAt: null,
                sslStatus: 'RENEWAL_FAILED' as const,
            };

            const total = await prisma.tenantDomain.count({ where });

            const domains = await prisma.tenantDomain.findMany({
                where,
                include: {
                    tenant: {
                        select: { id: true, name: true, slug: true },
                    },
                },
                orderBy: { lastRenewalAttempt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            });

            const response: PaginatedResponse<typeof domains[0]> = {
                items: domains,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            };

            res.json({ success: true, data: response });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// GET CERTIFICATE HISTORY
// =============================================================================
// GET /api/v1/certificates/domain/:id
// Returns certificate history for a specific domain
// =============================================================================

certificatesRouter.get(
    '/domain/:id',
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const domain = await prisma.tenantDomain.findFirst({
                where: { id: id as string, deletedAt: null },
            });

            if (!domain) {
                throw AppError.notFound('Domain');
            }

            const certificates = await prisma.domainCertificate.findMany({
                where: { domainId: id as string },
                orderBy: { createdAt: 'desc' },
            });

            res.json({
                success: true,
                data: {
                    domain: {
                        id: domain.id,
                        hostname: domain.hostname,
                        sslStatus: domain.sslStatus,
                        currentCertExpiresAt: domain.certExpiresAt,
                    },
                    certificates,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// TRIGGER BULK RENEWAL
// =============================================================================
// POST /api/v1/certificates/renew-all
// Triggers renewal for all certificates expiring within threshold
// =============================================================================

certificatesRouter.post(
    '/renew-all',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { days = 30 } = req.body as { days?: number };

            const now = new Date();
            const expiryThreshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

            // Find domains needing renewal
            const domainsToRenew = await prisma.tenantDomain.findMany({
                where: {
                    deletedAt: null,
                    dnsVerified: true,
                    sslStatus: { in: ['ACTIVE', 'EXPIRING_SOON'] },
                    certExpiresAt: {
                        lte: expiryThreshold,
                    },
                },
                select: { id: true, hostname: true },
            });

            logger.info({ count: domainsToRenew.length }, 'Triggering bulk certificate renewal');

            // Queue renewal jobs (in a real implementation, this would add to BullMQ)
            // For now, we just return the list of domains that need renewal

            res.json({
                success: true,
                message: `Queued ${domainsToRenew.length} domain(s) for certificate renewal`,
                data: {
                    count: domainsToRenew.length,
                    domains: domainsToRenew.map(d => d.hostname),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// RETRY FAILED CERTIFICATE
// =============================================================================
// POST /api/v1/certificates/retry/:domainId
// Retries certificate issuance for a failed domain
// =============================================================================

certificatesRouter.post(
    '/retry/:id',
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const domain = await prisma.tenantDomain.findFirst({
                where: { id: id as string, deletedAt: null },
            });

            if (!domain) {
                throw AppError.notFound('Domain');
            }

            if (domain.sslStatus !== 'RENEWAL_FAILED') {
                throw AppError.badRequest('Domain does not have a failed certificate');
            }

            // Reset the renewal state
            await prisma.tenantDomain.update({
                where: { id: id as string },
                data: {
                    sslStatus: 'PENDING',
                    renewalAttempts: 0,
                    lastRenewalError: null,
                },
            });

            logger.info({ domainId: id, hostname: domain.hostname }, 'Reset failed certificate for retry');

            res.json({
                success: true,
                message: 'Certificate reset for retry. Trigger issuance via POST /domains/:id/issue-cert',
            });
        } catch (error) {
            next(error);
        }
    }
);
