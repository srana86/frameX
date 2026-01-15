// =============================================================================
// Type Definitions
// =============================================================================
// TypeScript type definitions for the multi-tenant SSL system.
// Includes API request/response types, service interfaces, and domain entities.
// =============================================================================

import { TenantDomain as Domain, Tenant, DomainCertificate as Certificate, DomainStatus, SSLStatus, SSLProvider } from '@framex/database';

// =============================================================================
// API REQUEST TYPES
// =============================================================================

/**
 * Request body for creating a new domain
 */
export interface CreateDomainRequest {
    hostname: string;           // The custom domain to add
    tenantId: string;           // Tenant this domain belongs to
    isPrimary?: boolean;        // Set as primary domain for tenant
    sslProvider?: SSLProvider;  // Certificate provider preference
}

/**
 * Request body for updating a domain
 */
export interface UpdateDomainRequest {
    isPrimary?: boolean;
    sslProvider?: SSLProvider;
}

/**
 * Request body for creating a new tenant
 */
export interface CreateTenantRequest {
    name: string;               // Display name
    slug: string;               // URL-safe identifier
    backendHost?: string;       // Where to proxy requests
    backendPort?: number;       // Backend port
    maxDomains?: number;        // Domain limit
    wildcardEnabled?: boolean;  // Enable wildcard subdomains
    wildcardBaseDomain?: string;
}

/**
 * Request body for updating a tenant
 */
export interface UpdateTenantRequest {
    name?: string;
    backendHost?: string;
    backendPort?: number;
    isActive?: boolean;
    maxDomains?: number;
    wildcardEnabled?: boolean;
    wildcardBaseDomain?: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = void> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Domain with tenant info for API responses
 */
export interface DomainWithTenant extends Domain {
    tenant: Pick<Tenant, 'id' | 'name' | 'slug'>;
}

/**
 * Domain verification status response
 */
export interface DomainVerificationResponse {
    hostname: string;
    verified: boolean;
    method: string;
    instructions: {
        recordType: string;
        recordName: string;
        recordValue: string;
    };
    lastCheckedAt: Date | null;
    error?: string;
}

/**
 * Certificate status response
 */
export interface CertificateStatusResponse {
    hostname: string;
    status: SSLStatus;
    provider: SSLProvider;
    issuedAt?: Date;
    expiresAt?: Date;
    daysUntilExpiry?: number;
    error?: string;
}

// =============================================================================
// SERVICE INTERFACES
// =============================================================================

/**
 * DNS verification result
 */
export interface DnsVerificationResult {
    verified: boolean;
    recordFound: boolean;
    recordValue?: string;
    expectedValue: string;
    error?: string;
    resolvedIp?: string;
}

/**
 * ACME certificate issuance result
 */
export interface CertificateIssuanceResult {
    success: boolean;
    certPath?: string;
    keyPath?: string;
    expiresAt?: Date;
    error?: string;
}

/**
 * Nginx configuration result
 */
export interface NginxConfigResult {
    success: boolean;
    configPath?: string;
    error?: string;
    reloadRequired: boolean;
}

/**
 * Nginx reload result
 */
export interface NginxReloadResult {
    success: boolean;
    error?: string;
    testOutput?: string;
}

// =============================================================================
// WORKER TYPES
// =============================================================================

/**
 * Certificate renewal job data
 */
export interface CertRenewalJobData {
    domainId: string;
    hostname: string;
    forceRenewal?: boolean;
}

/**
 * Domain health check job data
 */
export interface DomainHealthJobData {
    domainId: string;
    hostname: string;
}

/**
 * Job result for certificate operations
 */
export interface CertJobResult {
    success: boolean;
    domainId: string;
    hostname: string;
    newExpiryDate?: Date;
    error?: string;
}

// =============================================================================
// NGINX TEMPLATE VARIABLES
// =============================================================================

/**
 * Variables for generating Nginx configuration from template
 */
export interface NginxTemplateVars {
    domain: string;
    backendHost: string;
    backendPort: number;
    certPath: string;
    keyPath: string;
    additionalServerNames?: string[];  // For wildcard/alias domains
    enableWebSocket?: boolean;
    customHeaders?: Record<string, string>;
}

// =============================================================================
// CLOUDFLARE TYPES
// =============================================================================

/**
 * Cloudflare origin certificate request
 */
export interface CloudflareOriginCertRequest {
    hostnames: string[];
    requestType: 'origin-rsa' | 'origin-ecc';
    validityDays: number;  // 7, 30, 90, 365, 730, 1095, 5475
}

/**
 * Cloudflare origin certificate response
 */
export interface CloudflareOriginCertResponse {
    id: string;
    certificate: string;
    privateKey: string;
    expiresOn: string;
    hostnames: string[];
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * Domain events for pub/sub or webhooks
 */
export type DomainEvent =
    | { type: 'domain.created'; data: Domain }
    | { type: 'domain.verified'; data: Domain }
    | { type: 'domain.ssl_issued'; data: Domain }
    | { type: 'domain.ssl_expiring'; data: Domain }
    | { type: 'domain.ssl_expired'; data: Domain }
    | { type: 'domain.deleted'; data: Domain };

// =============================================================================
// PAGINATION TYPES
// =============================================================================

/**
 * Pagination request parameters
 */
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Domain with all related data
 */
export interface DomainFull extends Domain {
    tenant: Tenant;
    certificates: Certificate[];
}

/**
 * SSL certificate summary for monitoring
 */
export interface CertificateSummary {
    total: number;
    active: number;
    expiringSoon: number;  // < 30 days
    expired: number;
    pendingIssuance: number;
    failed: number;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number;
    error?: string;
    details?: Record<string, unknown>;
}
