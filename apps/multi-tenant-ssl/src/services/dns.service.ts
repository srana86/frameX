// =============================================================================
// DNS Verification Service
// =============================================================================
// Handles DNS record verification for domain ownership.
// Uses Node.js DNS module for lookups with fallback to public DNS.
// =============================================================================

import dns from 'dns';
import { promisify } from 'util';
import { logger } from '../app';
import { DnsVerificationResult } from '../types';

// Promisify DNS functions
const resolveTxt = promisify(dns.resolveTxt);
const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

export class DnsService {
    // Timeout for DNS queries (ms)
    private readonly timeout = 10000;

    /**
     * Verifies a TXT record contains the expected verification token.
     * Used to verify domain ownership before issuing SSL certificates.
     * 
     * @param hostname - The domain to verify
     * @param expectedToken - The verification token to look for
     * @returns Verification result with details
     * 
     * @example
     * // Tenant should add this TXT record:
     * // _framex-verification.example.com TXT "framex-verify-abc123"
     * 
     * const result = await dnsService.verifyTxtRecord('example.com', 'framex-verify-abc123');
     * if (result.verified) {
     *   console.log('Domain verified!');
     * }
     */
    async verifyTxtRecord(
        hostname: string,
        expectedToken: string
    ): Promise<DnsVerificationResult> {
        const verificationHostname = `_framex-verification.${hostname}`;

        try {
            logger.debug({ verificationHostname, expectedToken }, 'Verifying DNS TXT record');

            // Look up TXT records with timeout
            const records = await this.withTimeout(
                resolveTxt(verificationHostname),
                this.timeout
            );

            // Flatten the array of arrays (TXT records can be split into multiple strings)
            const flatRecords = records.flat();

            logger.debug({ verificationHostname, foundRecords: flatRecords }, 'TXT records found');

            // Check if any record contains the expected token
            const recordFound = flatRecords.some(record =>
                record.toLowerCase().includes(expectedToken.toLowerCase())
            );

            if (recordFound) {
                return {
                    verified: true,
                    recordFound: true,
                    recordValue: flatRecords.find(r => r.includes(expectedToken)),
                    expectedValue: expectedToken,
                };
            }

            return {
                verified: false,
                recordFound: flatRecords.length > 0,
                recordValue: flatRecords[0],
                expectedValue: expectedToken,
                error: flatRecords.length > 0
                    ? 'TXT record found but value does not match'
                    : 'No TXT record found',
            };

        } catch (error) {
            const err = error as NodeJS.ErrnoException;

            // Differentiate between "no record" and other errors
            if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
                return {
                    verified: false,
                    recordFound: false,
                    expectedValue: expectedToken,
                    error: `No DNS TXT record found at ${verificationHostname}`,
                };
            }

            if (err.code === 'ETIMEOUT') {
                return {
                    verified: false,
                    recordFound: false,
                    expectedValue: expectedToken,
                    error: 'DNS query timed out. Please try again.',
                };
            }

            logger.error({ error, hostname }, 'DNS verification error');

            return {
                verified: false,
                recordFound: false,
                expectedValue: expectedToken,
                error: `DNS error: ${err.message}`,
            };
        }
    }

    /**
     * Resolves the A record(s) for a hostname.
     * Used to verify the domain points to our server IP.
     * 
     * @param hostname - The domain to resolve
     * @returns Array of IPv4 addresses
     */
    async resolveA(hostname: string): Promise<string[]> {
        try {
            const addresses = await this.withTimeout(resolve4(hostname), this.timeout);
            return addresses;
        } catch (error) {
            const err = error as NodeJS.ErrnoException;
            if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
                return [];
            }
            throw error;
        }
    }

    /**
     * Resolves the CNAME record for a hostname.
     * Used to verify subdomain CNAME configuration.
     * 
     * @param hostname - The subdomain to resolve
     * @returns CNAME target or null
     */
    async resolveCname(hostname: string): Promise<string | null> {
        try {
            const records = await this.withTimeout(resolveCname(hostname), this.timeout);
            return records.length > 0 ? records[0] : null;
        } catch (error) {
            const err = error as NodeJS.ErrnoException;
            if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
                return null;
            }
            throw error;
        }
    }

    /**
     * Verifies that a domain points to the expected IP address.
     * Used before issuing certificates to ensure DNS is properly configured.
     * 
     * @param hostname - The domain to verify
     * @param expectedIp - Expected A record IP
     */
    async verifyARecord(
        hostname: string,
        expectedIp: string
    ): Promise<DnsVerificationResult> {
        try {
            const addresses = await this.resolveA(hostname);

            if (addresses.length === 0) {
                return {
                    verified: false,
                    recordFound: false,
                    expectedValue: expectedIp,
                    error: 'No A record found for this domain',
                };
            }

            const verified = addresses.includes(expectedIp);

            return {
                verified,
                recordFound: true,
                recordValue: addresses[0],
                expectedValue: expectedIp,
                resolvedIp: addresses[0],
                error: verified ? undefined : `Domain points to ${addresses[0]}, expected ${expectedIp}`,
            };
        } catch (error) {
            const err = error as Error;
            return {
                verified: false,
                recordFound: false,
                expectedValue: expectedIp,
                error: `DNS error: ${err.message}`,
            };
        }
    }

    /**
     * Verifies that a subdomain has a CNAME pointing to our platform domain.
     * 
     * @param hostname - The subdomain to verify
     * @param expectedCname - Expected CNAME target (e.g., "proxy.yourplatform.com")
     */
    async verifyCnameRecord(
        hostname: string,
        expectedCname: string
    ): Promise<DnsVerificationResult> {
        try {
            const cname = await this.resolveCname(hostname);

            if (!cname) {
                return {
                    verified: false,
                    recordFound: false,
                    expectedValue: expectedCname,
                    error: 'No CNAME record found for this domain',
                };
            }

            // Normalize for comparison (remove trailing dots)
            const normalizedCname = cname.replace(/\.$/, '').toLowerCase();
            const normalizedExpected = expectedCname.replace(/\.$/, '').toLowerCase();

            const verified = normalizedCname === normalizedExpected;

            return {
                verified,
                recordFound: true,
                recordValue: cname,
                expectedValue: expectedCname,
                error: verified ? undefined : `CNAME points to ${cname}, expected ${expectedCname}`,
            };
        } catch (error) {
            const err = error as Error;
            return {
                verified: false,
                recordFound: false,
                expectedValue: expectedCname,
                error: `DNS error: ${err.message}`,
            };
        }
    }

    /**
     * Helper to add timeout to DNS queries.
     */
    private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject({ code: 'ETIMEOUT', message: 'Query timed out' }), ms)
            ),
        ]);
    }
}
