// =============================================================================
// Domain Routes
// =============================================================================
// API endpoints for managing tenant custom domains.
// Handles CRUD operations, DNS verification, and SSL certificate issuance.
// =============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma, logger } from '../app';
import { AppError } from '../middleware/error-handler';
import {
    validateBody,
    validateParams,
    validateQuery,
    createDomainSchema,
    updateDomainSchema,
    idParamSchema,
    paginationSchema,
} from '../middleware/validation';
import { DomainService } from '../services/domain.service';
import { DnsService } from '../services/dns.service';
import { NginxService } from '../services/nginx.service';
import { AcmeService } from '../services/acme.service';
import { ApiResponse, DomainVerificationResponse, PaginatedResponse } from '../types';
// Use TenantDomain from Prisma schema (exposed via @framex/database)
import type { TenantDomain } from '@framex/database';

export const domainsRouter: Router = Router();

// Initialize services
const domainService = new DomainService(prisma);
const dnsService = new DnsService();
const nginxService = new NginxService();
const acmeService = new AcmeService();

// =============================================================================
// LIST DOMAINS
// =============================================================================
// GET /api/v1/domains
// Query params: page, limit, tenantId, status
// =============================================================================

domainsRouter.get(
    '/',
    validateQuery(paginationSchema.extend({
        tenantId: paginationSchema.shape.sortBy.optional(),
        status: paginationSchema.shape.sortBy.optional(),
    })),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, sortBy, sortOrder, tenantId, status } = req.query as unknown as {
                page: number;
                limit: number;
                sortBy?: string;
                sortOrder: 'asc' | 'desc';
                tenantId?: string;
                status?: string;
            };

            // Build where clause
            const where: Record<string, unknown> = {
                deletedAt: null,
            };

            if (tenantId) where.tenantId = tenantId;
            if (status) where.status = status;

            // Get total count
            const total = await prisma.tenantDomain.count({ where });

            // Get paginated domains
            const domains = await prisma.tenantDomain.findMany({
                where,
                include: {
                    tenant: {
                        select: { id: true, name: true, slug: true },
                    },
                },
                orderBy: { [sortBy || 'createdAt']: sortOrder },
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
// GET SINGLE DOMAIN
// =============================================================================
// GET /api/v1/domains/:id
// =============================================================================

domainsRouter.get(
    '/:id',
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id as string;

            const domain = await prisma.tenantDomain.findFirst({
                where: { id, deletedAt: null },
                include: {
                    tenant: {
                        select: { id: true, name: true, slug: true, backendHost: true, backendPort: true },
                    },
                    certificates: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            });

            if (!domain) {
                throw AppError.notFound('Domain');
            }

            res.json({ success: true, data: domain });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// CREATE DOMAIN
// =============================================================================
// POST /api/v1/domains
// Body: { hostname, tenantId, isPrimary?, sslProvider? }
// =============================================================================

domainsRouter.post(
    '/',
    validateBody(createDomainSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { hostname, tenantId, isPrimary, sslProvider } = req.body;

            // Verify tenant exists and is active
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                include: { domains: { where: { deletedAt: null } } },
            });

            if (!tenant) {
                throw AppError.notFound('Tenant');
            }

            if (!tenant.isActive) {
                throw AppError.badRequest('Tenant is not active');
            }

            // Check domain limit
            if (tenant.domains.length >= tenant.maxDomains) {
                throw AppError.badRequest(
                    `Domain limit reached (${tenant.maxDomains}). Upgrade to add more domains.`
                );
            }

            // Check if domain already exists
            const existingDomain = await prisma.tenantDomain.findFirst({
                where: { hostname },
            });

            if (existingDomain) {
                if (existingDomain.deletedAt) {
                    // Domain was soft-deleted, can be re-claimed
                    throw AppError.conflict(
                        'This domain was previously registered. Contact support to reclaim it.'
                    );
                }
                throw AppError.conflict('Domain already registered');
            }

            // Create the domain
            const domain = await domainService.createDomain({
                hostname,
                tenantId,
                isPrimary,
                sslProvider,
            });

            logger.info({ domainId: domain.id, hostname }, 'Domain created');

            // Return domain with verification instructions
            const verificationResponse: DomainVerificationResponse = {
                hostname: domain.hostname,
                verified: false,
                method: 'DNS_TXT',
                instructions: {
                    recordType: 'TXT',
                    recordName: `_framex-verification.${hostname}`,
                    recordValue: domain.verificationToken,
                },
                lastCheckedAt: null,
            };

            res.status(201).json({
                success: true,
                data: domain,
                message: 'Domain created. Add the DNS TXT record to verify ownership.',
                verification: verificationResponse,
            });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// UPDATE DOMAIN
// =============================================================================
// PATCH /api/v1/domains/:id
// Body: { isPrimary?, sslProvider? }
// =============================================================================

domainsRouter.patch(
    '/:id',
    validateParams(idParamSchema),
    validateBody(updateDomainSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id as string;
            const updates = req.body;

            const domain = await prisma.tenantDomain.findFirst({
                where: { id, deletedAt: null },
            });

            if (!domain) {
                throw AppError.notFound('Domain');
            }

            // If setting as primary, unset other primary domains for this tenant
            if (updates.isPrimary) {
                await prisma.tenantDomain.updateMany({
                    where: { tenantId: domain.tenantId, isPrimary: true, id: { not: id } },
                    data: { isPrimary: false },
                });
            }

            const updatedDomain = await prisma.tenantDomain.update({
                where: { id },
                data: updates,
            });

            logger.info({ domainId: id }, 'Domain updated');

            res.json({ success: true, data: updatedDomain });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// DELETE DOMAIN
// =============================================================================
// DELETE /api/v1/domains/:id
// Performs soft delete and removes Nginx configuration
// =============================================================================

domainsRouter.delete(
    '/:id',
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id as string;

            const domain = await prisma.tenantDomain.findFirst({
                where: { id, deletedAt: null },
            });

            if (!domain) {
                throw AppError.notFound('Domain');
            }

            // Remove Nginx configuration
            if (domain.nginxConfigured) {
                try {
                    await nginxService.removeConfig(domain.hostname);
                    await nginxService.reload();
                    logger.info({ hostname: domain.hostname }, 'Nginx config removed');
                } catch (error) {
                    logger.error({ error, hostname: domain.hostname }, 'Failed to remove Nginx config');
                    // Continue with deletion even if Nginx removal fails
                }
            }

            // Soft delete the domain
            await prisma.tenantDomain.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    status: 'DELETED',
                    nginxConfigured: false,
                },
            });

            // Deactivate certificates
            await prisma.domainCertificate.updateMany({
                where: { domainId: id },
                data: { isActive: false },
            });

            // Log audit event
            await prisma.domainAuditLog.create({
                data: {
                    action: 'DOMAIN_DELETED',
                    entityType: 'Domain',
                    entityId: id,
                    actorType: 'api',
                    details: { hostname: domain.hostname },
                },
            });

            logger.info({ domainId: id, hostname: domain.hostname }, 'Domain deleted');

            res.json({
                success: true,
                message: 'Domain deleted successfully',
            } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// VERIFY DOMAIN DNS
// =============================================================================
// POST /api/v1/domains/:id/verify
// Checks if the DNS TXT record is properly configured
// =============================================================================

domainsRouter.post(
    '/:id/verify',
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id as string;

            const domain = await prisma.tenantDomain.findFirst({
                where: { id, deletedAt: null },
            });

            if (!domain) {
                throw AppError.notFound('Domain');
            }

            if (domain.dnsVerified) {
                return res.json({
                    success: true,
                    message: 'Domain already verified',
                    data: { verified: true, verifiedAt: domain.dnsVerifiedAt },
                });
            }

            // Perform DNS verification
            const result = await dnsService.verifyTxtRecord(
                domain.hostname,
                domain.verificationToken
            );

            // Update domain record
            await prisma.tenantDomain.update({
                where: { id },
                data: {
                    dnsLastCheckedAt: new Date(),
                    dnsCheckError: result.error || null,
                    ...(result.verified && {
                        dnsVerified: true,
                        dnsVerifiedAt: new Date(),
                        status: 'VERIFIED',
                    }),
                    ...(!result.verified && {
                        status: 'VERIFICATION_FAILED',
                    }),
                },
            });

            if (result.verified) {
                // Log audit event
                await prisma.domainAuditLog.create({
                    data: {
                        action: 'DOMAIN_VERIFIED',
                        entityType: 'Domain',
                        entityId: id,
                        actorType: 'api',
                    },
                });

                logger.info({ domainId: id, hostname: domain.hostname }, 'Domain verified');
            }

            const response: DomainVerificationResponse = {
                hostname: domain.hostname,
                verified: result.verified,
                method: domain.verificationMethod,
                instructions: {
                    recordType: 'TXT',
                    recordName: `_framex-verification.${domain.hostname}`,
                    recordValue: domain.verificationToken,
                },
                lastCheckedAt: new Date(),
                error: result.error,
            };

            res.json({
                success: true,
                data: response,
                message: result.verified
                    ? 'Domain verified successfully! You can now issue an SSL certificate.'
                    : 'DNS verification failed. Please check your DNS settings.',
            });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// ISSUE SSL CERTIFICATE
// =============================================================================
// POST /api/v1/domains/:id/issue-cert
// Issues an SSL certificate via ACME (Let's Encrypt) or Cloudflare
// =============================================================================

domainsRouter.post(
    '/:id/issue-cert',
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id as string;
            const { force } = req.body as { force?: boolean };

            const domain = await prisma.tenantDomain.findFirst({
                where: { id, deletedAt: null },
                include: { tenant: true },
            });

            if (!domain) {
                throw AppError.notFound('Domain');
            }

            // Check prerequisites
            if (!domain.dnsVerified) {
                throw AppError.badRequest('Domain must be verified before issuing SSL certificate');
            }

            if (domain.sslStatus === 'ISSUING') {
                throw AppError.badRequest('Certificate issuance already in progress');
            }

            if (domain.sslStatus === 'ACTIVE' && !force) {
                const expiresAt = domain.certExpiresAt;
                if (expiresAt && expiresAt > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
                    throw AppError.badRequest(
                        'Valid certificate exists. Use force=true to renew early.'
                    );
                }
            }

            // Update status to issuing
            await prisma.tenantDomain.update({
                where: { id },
                data: { sslStatus: 'ISSUING' },
            });

            logger.info({ domainId: id, hostname: domain.hostname }, 'Starting certificate issuance');

            // Issue certificate via ACME
            const result = await acmeService.issueCertificate(domain.hostname);

            if (result.success) {
                // Update domain with certificate info
                await prisma.tenantDomain.update({
                    where: { id },
                    data: {
                        sslStatus: 'ACTIVE',
                        certPath: result.certPath,
                        keyPath: result.keyPath,
                        certIssuedAt: new Date(),
                        certExpiresAt: result.expiresAt,
                        lastRenewalAttempt: new Date(),
                        lastRenewalError: null,
                        renewalAttempts: 0,
                    },
                });

                // Create certificate record
                await prisma.domainCertificate.create({
                    data: {
                        domainId: id,
                        issuer: 'Let\'s Encrypt',
                        commonName: domain.hostname,
                        altNames: [domain.hostname],
                        issuedAt: new Date(),
                        expiresAt: result.expiresAt!,
                        isActive: true,
                    },
                });

                // Generate and apply Nginx configuration
                await nginxService.createConfig({
                    domain: domain.hostname,
                    backendHost: domain.tenant.backendHost,
                    backendPort: domain.tenant.backendPort,
                    certPath: result.certPath!,
                    keyPath: result.keyPath!,
                });

                // Reload Nginx
                await nginxService.reload();

                await prisma.tenantDomain.update({
                    where: { id },
                    data: {
                        status: 'ACTIVE',
                        nginxConfigured: true,
                        nginxLastReload: new Date(),
                    },
                });

                // Log audit event
                await prisma.domainAuditLog.create({
                    data: {
                        action: 'CERT_ISSUED',
                        entityType: 'Domain',
                        entityId: id,
                        actorType: 'api',
                        details: { expiresAt: result.expiresAt },
                    },
                });

                logger.info({
                    domainId: id,
                    hostname: domain.hostname,
                    expiresAt: result.expiresAt,
                }, 'Certificate issued successfully');

                res.json({
                    success: true,
                    message: 'SSL certificate issued and configured successfully',
                    data: {
                        hostname: domain.hostname,
                        status: 'ACTIVE',
                        expiresAt: result.expiresAt,
                    },
                });
            } else {
                // Certificate issuance failed
                await prisma.tenantDomain.update({
                    where: { id },
                    data: {
                        sslStatus: 'RENEWAL_FAILED',
                        lastRenewalAttempt: new Date(),
                        lastRenewalError: result.error,
                        renewalAttempts: { increment: 1 },
                    },
                });

                // Log audit event
                await prisma.domainAuditLog.create({
                    data: {
                        action: 'CERT_RENEWAL_FAILED',
                        entityType: 'Domain',
                        entityId: id,
                        actorType: 'api',
                        details: { error: result.error },
                        success: false,
                        errorMessage: result.error,
                    },
                });

                logger.error({
                    domainId: id,
                    hostname: domain.hostname,
                    error: result.error,
                }, 'Certificate issuance failed');

                throw AppError.internal(`Certificate issuance failed: ${result.error}`);
            }
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// GET VERIFICATION INSTRUCTIONS
// =============================================================================
// GET /api/v1/domains/:id/verification
// Returns DNS verification instructions for a domain
// =============================================================================

domainsRouter.get(
    '/:id/verification',
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id as string;

            const domain = await prisma.tenantDomain.findFirst({
                where: { id, deletedAt: null },
            });

            if (!domain) {
                throw AppError.notFound('Domain');
            }

            const response: DomainVerificationResponse = {
                hostname: domain.hostname,
                verified: domain.dnsVerified,
                method: domain.verificationMethod,
                instructions: {
                    recordType: 'TXT',
                    recordName: `_framex-verification.${domain.hostname}`,
                    recordValue: domain.verificationToken,
                },
                lastCheckedAt: domain.dnsLastCheckedAt,
                error: domain.dnsCheckError || undefined,
            };

            res.json({ success: true, data: response });
        } catch (error) {
            next(error);
        }
    }
);
