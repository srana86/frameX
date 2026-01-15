// =============================================================================
// Cloudflare Service
// =============================================================================
// Optional service for Cloudflare integration.
// Supports origin certificates and DNS management via Cloudflare API.
// =============================================================================

import { config } from '../config';
import { logger } from '../app';
import { CloudflareOriginCertRequest, CloudflareOriginCertResponse } from '../types';

export class CloudflareService {
    private readonly apiToken: string | undefined;
    private readonly zoneId: string | undefined;
    private readonly baseUrl = 'https://api.cloudflare.com/client/v4';

    constructor() {
        this.apiToken = config.cloudflare.apiToken;
        this.zoneId = config.cloudflare.zoneId;
    }

    /**
     * Checks if Cloudflare integration is configured.
     */
    isConfigured(): boolean {
        return !!(this.apiToken && this.zoneId);
    }

    /**
     * Creates a Cloudflare origin certificate.
     * Origin certificates are trusted between Cloudflare edge and your origin server.
     * They can be valid for up to 15 years.
     * 
     * @param hostnames - Domains to include in the certificate
     * @param validityDays - Validity period in days (7, 30, 90, 365, 730, 1095, 5475)
     * @returns Certificate and private key in PEM format
     * 
     * @example
     * const cert = await cloudflareService.createOriginCertificate(
     *   ['shop.example.com', '*.shop.example.com'],
     *   365
     * );
     */
    async createOriginCertificate(
        hostnames: string[],
        validityDays: number = 365
    ): Promise<CloudflareOriginCertResponse | null> {
        if (!this.isConfigured()) {
            logger.warn('Cloudflare not configured');
            return null;
        }

        try {
            const requestBody: CloudflareOriginCertRequest = {
                hostnames,
                requestType: 'origin-rsa',
                validityDays,
            };

            const response = await fetch(`${this.baseUrl}/certificates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json() as {
                success: boolean;
                result?: CloudflareOriginCertResponse;
                errors?: Array<{ message: string }>;
            };

            if (!data.success) {
                const error = data.errors?.[0]?.message || 'Unknown error';
                logger.error({ error, hostnames }, 'Failed to create Cloudflare origin certificate');
                return null;
            }

            logger.info({
                hostnames,
                expiresOn: data.result?.expiresOn
            }, 'Cloudflare origin certificate created');

            return data.result || null;

        } catch (error) {
            logger.error({ error, hostnames }, 'Cloudflare API error');
            return null;
        }
    }

    /**
     * Revokes a Cloudflare origin certificate.
     * 
     * @param certificateId - The certificate ID to revoke
     */
    async revokeOriginCertificate(certificateId: string): Promise<boolean> {
        if (!this.isConfigured()) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/certificates/${certificateId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                },
            });

            const data = await response.json() as { success: boolean };

            if (data.success) {
                logger.info({ certificateId }, 'Cloudflare origin certificate revoked');
            }

            return data.success;

        } catch (error) {
            logger.error({ error, certificateId }, 'Failed to revoke Cloudflare certificate');
            return false;
        }
    }

    /**
     * Gets DNS records for the configured zone.
     * Useful for verifying domain configuration.
     * 
     * @param hostname - Domain to look up
     */
    async getDnsRecords(hostname: string): Promise<{
        type: string;
        name: string;
        content: string;
        proxied: boolean;
    }[] | null> {
        if (!this.isConfigured()) {
            return null;
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/zones/${this.zoneId}/dns_records?name=${hostname}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`,
                    },
                }
            );

            const data = await response.json() as {
                success: boolean;
                result?: Array<{
                    type: string;
                    name: string;
                    content: string;
                    proxied: boolean;
                }>;
            };

            return data.result || null;

        } catch (error) {
            logger.error({ error, hostname }, 'Failed to get Cloudflare DNS records');
            return null;
        }
    }

    /**
     * Creates a DNS record in Cloudflare.
     * Useful for automatic DNS configuration.
     * 
     * @param type - Record type (A, AAAA, CNAME, TXT)
     * @param name - Record name (hostname)
     * @param content - Record content (IP, hostname, text)
     * @param proxied - Whether to proxy through Cloudflare
     */
    async createDnsRecord(
        type: 'A' | 'AAAA' | 'CNAME' | 'TXT',
        name: string,
        content: string,
        proxied: boolean = false
    ): Promise<string | null> {
        if (!this.isConfigured()) {
            return null;
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/zones/${this.zoneId}/dns_records`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type,
                        name,
                        content,
                        proxied,
                        ttl: proxied ? 1 : 3600,  // Auto TTL for proxied records
                    }),
                }
            );

            const data = await response.json() as {
                success: boolean;
                result?: { id: string };
                errors?: Array<{ message: string }>;
            };

            if (data.success && data.result) {
                logger.info({ type, name, content }, 'Cloudflare DNS record created');
                return data.result.id;
            }

            const error = data.errors?.[0]?.message || 'Unknown error';
            logger.error({ error, type, name }, 'Failed to create DNS record');
            return null;

        } catch (error) {
            logger.error({ error, type, name }, 'Cloudflare API error');
            return null;
        }
    }

    /**
     * Deletes a DNS record from Cloudflare.
     * 
     * @param recordId - The DNS record ID to delete
     */
    async deleteDnsRecord(recordId: string): Promise<boolean> {
        if (!this.isConfigured()) {
            return false;
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/zones/${this.zoneId}/dns_records/${recordId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`,
                    },
                }
            );

            const data = await response.json() as { success: boolean };
            return data.success;

        } catch (error) {
            logger.error({ error, recordId }, 'Failed to delete DNS record');
            return false;
        }
    }

    /**
     * Purges Cloudflare cache for a domain.
     * Should be called after significant changes to ensure fresh content.
     * 
     * @param hostnames - Domains to purge cache for
     */
    async purgeCache(hostnames: string[]): Promise<boolean> {
        if (!this.isConfigured()) {
            return false;
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/zones/${this.zoneId}/purge_cache`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ hosts: hostnames }),
                }
            );

            const data = await response.json() as { success: boolean };

            if (data.success) {
                logger.info({ hostnames }, 'Cloudflare cache purged');
            }

            return data.success;

        } catch (error) {
            logger.error({ error, hostnames }, 'Failed to purge cache');
            return false;
        }
    }
}
