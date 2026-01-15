// =============================================================================
// Domain Service
// =============================================================================
// Business logic for domain management operations.
// Handles domain creation, validation, and status management.
// =============================================================================

import { PrismaClient, TenantDomain, Prisma } from '@framex/database';
import { CreateDomainInput } from '../middleware/validation';

export class DomainService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Creates a new domain record with initial verification state.
     * 
     * @param data - Domain creation data
     * @returns Created domain with verification token
     */
    async createDomain(data: CreateDomainInput): Promise<TenantDomain> {
        // Generate a unique verification token
        const verificationToken = this.generateVerificationToken();

        // Determine if this is a wildcard domain
        const isWildcard = data.hostname.startsWith('*.');

        const domain = await this.prisma.tenantDomain.create({
            data: {
                hostname: data.hostname.toLowerCase(),
                tenantId: data.tenantId,
                primaryDomain: data.hostname.toLowerCase(),
                isPrimary: data.isPrimary,
                isWildcard,
                sslProvider: data.sslProvider,
                verificationToken,
                verificationMethod: 'DNS_TXT',
                status: 'PENDING_VERIFICATION',
                sslStatus: 'PENDING',
            },
        });

        // Create audit log entry
        await this.prisma.domainAuditLog.create({
            data: {
                action: 'DOMAIN_CREATED',
                entityType: 'Domain',
                entityId: domain.id,
                actorType: 'api',
                details: { hostname: domain.hostname },
            },
        });

        return domain;
    }

    /**
     * Generates a unique verification token for DNS verification.
     * Format: framex-verify-{random}
     */
    private generateVerificationToken(): string {
        const randomPart = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        return `framex-verify-${randomPart}`;
    }

    /**
     * Finds domains that need certificate renewal.
     * Returns domains with certificates expiring within the specified days.
     * 
     * @param daysThreshold - Days before expiry to include
     * @returns Domains needing renewal
     */
    async findDomainsNeedingRenewal(daysThreshold: number = 30): Promise<TenantDomain[]> {
        const now = new Date();
        const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

        return this.prisma.tenantDomain.findMany({
            where: {
                deletedAt: null,
                dnsVerified: true,
                sslStatus: { in: ['ACTIVE', 'EXPIRING_SOON'] },
                certExpiresAt: {
                    lte: thresholdDate,
                },
            },
            include: {
                tenant: true,
            },
        });
    }

    /**
     * Finds domains with expired certificates.
     */
    async findExpiredDomains(): Promise<TenantDomain[]> {
        const now = new Date();

        return this.prisma.tenantDomain.findMany({
            where: {
                deletedAt: null,
                certExpiresAt: {
                    lt: now,
                },
                sslStatus: { not: 'EXPIRED' },
            },
        });
    }

    /**
     * Updates domain SSL status and marks as expiring soon if within threshold.
     * Called by the certificate renewal worker.
     */
    async updateExpiryStatus(daysThreshold: number = 30): Promise<number> {
        const now = new Date();
        const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

        // Mark expired certificates
        const expiredResult = await this.prisma.tenantDomain.updateMany({
            where: {
                deletedAt: null,
                certExpiresAt: { lt: now },
                sslStatus: { not: 'EXPIRED' },
            },
            data: { sslStatus: 'EXPIRED' },
        });

        // Mark expiring soon
        const expiringResult = await this.prisma.tenantDomain.updateMany({
            where: {
                deletedAt: null,
                certExpiresAt: { gte: now, lte: thresholdDate },
                sslStatus: 'ACTIVE',
            },
            data: { sslStatus: 'EXPIRING_SOON' },
        });

        return expiredResult.count + expiringResult.count;
    }

    /**
     * Gets domain by hostname.
     */
    async getByHostname(hostname: string): Promise<TenantDomain | null> {
        return this.prisma.tenantDomain.findFirst({
            where: {
                hostname: hostname.toLowerCase(),
                deletedAt: null,
            },
            include: {
                tenant: true,
            },
        });
    }

    /**
     * Gets the backend routing information for a domain.
     * Used by the reverse proxy to determine where to forward requests.
     */
    async getRoutingInfo(hostname: string): Promise<{
        backendHost: string;
        backendPort: number;
    } | null> {
        const domain = await this.prisma.tenantDomain.findFirst({
            where: {
                hostname: hostname.toLowerCase(),
                status: 'ACTIVE',
                deletedAt: null,
            },
            include: {
                tenant: {
                    select: {
                        backendHost: true,
                        backendPort: true,
                    },
                },
            },
        });

        if (!domain) {
            return null;
        }

        return {
            backendHost: domain.tenant.backendHost,
            backendPort: domain.tenant.backendPort,
        };
    }
}
