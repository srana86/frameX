// =============================================================================
// Tenant Routes
// =============================================================================
// API endpoints for managing tenants (customers/organizations).
// Each tenant can have multiple custom domains pointing to their app instance.
// =============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma, logger } from '../app';
import { AppError } from '../middleware/error-handler';
import {
    validateBody,
    validateParams,
    validateQuery,
    createTenantSchema,
    updateTenantSchema,
    idParamSchema,
    paginationSchema,
} from '../middleware/validation';
import { PaginatedResponse } from '../types';

export const tenantsRouter: Router = Router();

// =============================================================================
// LIST TENANTS
// =============================================================================
// GET /api/v1/tenants
// Query params: page, limit, isActive
// =============================================================================

tenantsRouter.get(
    '/',
    validateQuery(paginationSchema.extend({
        isActive: paginationSchema.shape.sortBy.optional(),
    })),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, sortBy, sortOrder, isActive } = req.query as unknown as {
                page: number;
                limit: number;
                sortBy?: string;
                sortOrder: 'asc' | 'desc';
                isActive?: string;
            };

            // Build where clause
            const where: Record<string, unknown> = {};
            if (isActive !== undefined) {
                where.isActive = isActive === 'true';
            }

            // Get total count
            const total = await prisma.tenant.count({ where });

            // Get paginated tenants with domain count
            const tenants = await prisma.tenant.findMany({
                where,
                include: {
                    _count: {
                        select: { domains: true },
                    },
                },
                orderBy: { [sortBy || 'createdAt']: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            });

            const response: PaginatedResponse<typeof tenants[0]> = {
                items: tenants,
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
// GET SINGLE TENANT
// =============================================================================
// GET /api/v1/tenants/:id
// =============================================================================

tenantsRouter.get(
    '/:id',
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const tenant = await prisma.tenant.findUnique({
                where: { id: id as string },
                include: {
                    domains: {
                        where: { deletedAt: null },
                        orderBy: { isPrimary: 'desc' },
                    },
                    _count: {
                        select: { domains: true },
                    },
                },
            });

            if (!tenant) {
                throw AppError.notFound('Tenant');
            }

            res.json({ success: true, data: tenant });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// GET TENANT BY SLUG
// =============================================================================
// GET /api/v1/tenants/by-slug/:slug
// =============================================================================

tenantsRouter.get(
    '/by-slug/:slug',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { slug } = req.params;

            const tenant = await prisma.tenant.findUnique({
                where: { slug: slug as string },
                include: {
                    domains: {
                        where: { deletedAt: null, status: 'ACTIVE' },
                        orderBy: { isPrimary: 'desc' },
                    },
                },
            });

            if (!tenant) {
                throw AppError.notFound('Tenant');
            }

            res.json({ success: true, data: tenant });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// CREATE TENANT
// =============================================================================
// POST /api/v1/tenants
// Body: { name, slug, backendHost?, backendPort?, maxDomains?, wildcardEnabled? }
// =============================================================================

tenantsRouter.post(
    '/',
    validateBody(createTenantSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;

            // Create the tenant
            const tenant = await prisma.tenant.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    email: data.email, // Required field on Tenant model
                    backendHost: data.backendHost,
                    backendPort: data.backendPort,
                    maxDomains: data.maxDomains,
                },
            });

            // Log audit event
            await prisma.domainAuditLog.create({
                data: {
                    action: 'TENANT_CREATED',
                    entityType: 'Tenant',
                    entityId: tenant.id,
                    actorType: 'api',
                    details: { name: tenant.name, slug: tenant.slug },
                },
            });

            logger.info({ tenantId: tenant.id, slug: tenant.slug }, 'Tenant created');

            res.status(201).json({
                success: true,
                data: tenant,
                message: 'Tenant created successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// UPDATE TENANT
// =============================================================================
// PATCH /api/v1/tenants/:id
// Body: { name?, backendHost?, backendPort?, isActive?, maxDomains?, wildcardEnabled? }
// =============================================================================

tenantsRouter.patch(
    '/:id',
    validateParams(idParamSchema),
    validateBody(updateTenantSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const tenant = await prisma.tenant.findUnique({
                where: { id: id as string },
            });

            if (!tenant) {
                throw AppError.notFound('Tenant');
            }

            const updatedTenant = await prisma.tenant.update({
                where: { id: id as string },
                data: updates,
            });

            // Log status change if applicable
            if (updates.isActive !== undefined && updates.isActive !== tenant.isActive) {
                await prisma.domainAuditLog.create({
                    data: {
                        action: updates.isActive ? 'TENANT_ACTIVATED' : 'TENANT_SUSPENDED',
                        entityType: 'Tenant',
                        entityId: id as string,
                        actorType: 'api',
                    },
                });
            }

            logger.info({ tenantId: id }, 'Tenant updated');

            res.json({ success: true, data: updatedTenant });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// DELETE TENANT
// =============================================================================
// DELETE /api/v1/tenants/:id
// Note: This will also delete all associated domains
// =============================================================================

tenantsRouter.delete(
    '/:id',
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const tenant = await prisma.tenant.findUnique({
                where: { id: id as string },
                include: {
                    domains: {
                        where: { deletedAt: null },
                    },
                },
            });

            if (!tenant) {
                throw AppError.notFound('Tenant');
            }

            // Check for active domains
            const activeDomains = tenant.domains.filter(d => d.status === 'ACTIVE');
            if (activeDomains.length > 0) {
                throw AppError.badRequest(
                    `Cannot delete tenant with ${activeDomains.length} active domain(s). ` +
                    'Delete or transfer domains first.'
                );
            }

            // Soft delete all domains
            if (tenant.domains.length > 0) {
                await prisma.tenantDomain.updateMany({
                    where: { tenantId: id as string },
                    data: { deletedAt: new Date(), status: 'DELETED' },
                });
            }

            // Delete the tenant (hard delete since domains are soft-deleted)
            await prisma.tenant.delete({
                where: { id: id as string },
            });

            logger.info({ tenantId: id, slug: tenant.slug }, 'Tenant deleted');

            res.json({
                success: true,
                message: 'Tenant deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

// =============================================================================
// GET TENANT STATS
// =============================================================================
// GET /api/v1/tenants/:id/stats
// Returns statistics about the tenant's domains and certificates
// =============================================================================

tenantsRouter.get(
    '/:id/stats',
    validateParams(idParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const tenant = await prisma.tenant.findUnique({
                where: { id: id as string },
            });

            if (!tenant) {
                throw AppError.notFound('Tenant');
            }

            // Get domain statistics
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            const [domainStats] = await prisma.$queryRaw<[{
                total: bigint;
                active: bigint;
                pending: bigint;
                expiring_soon: bigint;
            }]>`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE "status" = 'ACTIVE') as active,
          COUNT(*) FILTER (WHERE "status" = 'PENDING_VERIFICATION') as pending,
          COUNT(*) FILTER (WHERE "certExpiresAt" < ${thirtyDaysFromNow} AND "certExpiresAt" > ${now}) as expiring_soon
        FROM "Domain"
        WHERE "tenantId" = ${id} AND "deletedAt" IS NULL
      `;

            res.json({
                success: true,
                data: {
                    tenant: {
                        id: tenant.id,
                        name: tenant.name,
                        slug: tenant.slug,
                    },
                    domains: {
                        total: Number(domainStats.total),
                        active: Number(domainStats.active),
                        pending: Number(domainStats.pending),
                        expiringSoon: Number(domainStats.expiring_soon),
                        limit: tenant.maxDomains,
                        remaining: tenant.maxDomains - Number(domainStats.total),
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);
