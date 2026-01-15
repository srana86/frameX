// =============================================================================
// Request Validation Middleware
// =============================================================================
// Zod-based request validation for type-safe API endpoints.
// Validates body, query parameters, and URL parameters.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ParsedQs } from 'qs';

/**
 * Creates a validation middleware for request body.
 * 
 * @example
 * const createDomainSchema = z.object({
 *   hostname: z.string().min(1),
 *   tenantId: z.string().cuid(),
 * });
 * 
 * router.post('/', validateBody(createDomainSchema), createDomain);
 */
export function validateBody<T extends ZodSchema>(schema: T) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Creates a validation middleware for query parameters.
 * 
 * @example
 * const listDomainsSchema = z.object({
 *   page: z.coerce.number().min(1).default(1),
 *   limit: z.coerce.number().min(1).max(100).default(20),
 * });
 * 
 * router.get('/', validateQuery(listDomainsSchema), listDomains);
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as ParsedQs;
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Creates a validation middleware for URL parameters.
 * 
 * @example
 * const domainParamsSchema = z.object({
 *   id: z.string().cuid(),
 * });
 * 
 * router.get('/:id', validateParams(domainParamsSchema), getDomain);
 */
export function validateParams<T extends ZodSchema>(schema: T) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.params = schema.parse(req.params) as Request['params'];
            next();
        } catch (error) {
            next(error);
        }
    };
}

// =============================================================================
// COMMON VALIDATION SCHEMAS
// =============================================================================

/**
 * Common ID parameter validation
 */
export const idParamSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

/**
 * Common pagination query parameters
 */
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Hostname validation (domain name)
 * Validates format like: example.com, sub.example.com, *.example.com
 */
export const hostnameSchema = z.string()
    .min(1, 'Hostname is required')
    .max(253, 'Hostname too long')
    .regex(
        /^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
        'Invalid hostname format'
    )
    .transform(h => h.toLowerCase());

/**
 * Slug validation (URL-safe identifier)
 */
export const slugSchema = z.string()
    .min(1, 'Slug is required')
    .max(63, 'Slug too long')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Invalid slug format (lowercase letters, numbers, hyphens)')
    .transform(s => s.toLowerCase());

// =============================================================================
// DOMAIN VALIDATION SCHEMAS
// =============================================================================

/**
 * Schema for creating a new domain
 */
export const createDomainSchema = z.object({
    hostname: hostnameSchema,
    tenantId: z.string().min(1, 'Tenant ID is required'),
    isPrimary: z.boolean().optional().default(false),
    sslProvider: z.enum(['LETS_ENCRYPT', 'CLOUDFLARE', 'CUSTOM']).optional().default('LETS_ENCRYPT'),
});

/**
 * Schema for updating a domain
 */
export const updateDomainSchema = z.object({
    isPrimary: z.boolean().optional(),
    sslProvider: z.enum(['LETS_ENCRYPT', 'CLOUDFLARE', 'CUSTOM']).optional(),
});

// =============================================================================
// TENANT VALIDATION SCHEMAS
// =============================================================================

/**
 * Schema for creating a new tenant
 */
export const createTenantSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    slug: slugSchema,
    backendHost: z.string().default('localhost'),
    backendPort: z.coerce.number().int().min(1).max(65535).default(3000),
    maxDomains: z.coerce.number().int().min(1).max(100).default(5),
    wildcardEnabled: z.boolean().optional().default(false),
    wildcardBaseDomain: hostnameSchema.optional(),
});

/**
 * Schema for updating a tenant
 */
export const updateTenantSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    backendHost: z.string().optional(),
    backendPort: z.coerce.number().int().min(1).max(65535).optional(),
    isActive: z.boolean().optional(),
    maxDomains: z.coerce.number().int().min(1).max(100).optional(),
    wildcardEnabled: z.boolean().optional(),
    wildcardBaseDomain: hostnameSchema.optional(),
});

// =============================================================================
// CERTIFICATE VALIDATION SCHEMAS
// =============================================================================

/**
 * Schema for issuing a certificate
 */
export const issueCertSchema = z.object({
    domainId: z.string().min(1, 'Domain ID is required'),
    forceRenewal: z.boolean().optional().default(false),
});

/**
 * Schema for uploading a custom certificate
 */
export const uploadCertSchema = z.object({
    domainId: z.string().min(1, 'Domain ID is required'),
    certificate: z.string().min(1, 'Certificate PEM is required'),
    privateKey: z.string().min(1, 'Private key PEM is required'),
    chain: z.string().optional(),
});

// Export type inference helpers
export type CreateDomainInput = z.infer<typeof createDomainSchema>;
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type IssueCertInput = z.infer<typeof issueCertSchema>;
export type UploadCertInput = z.infer<typeof uploadCertSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
