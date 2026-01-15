// =============================================================================
// ACME Certificate Service
// =============================================================================
// Handles SSL certificate issuance and renewal using acme.sh.
// Supports Let's Encrypt production and staging environments.
// =============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { logger } from '../app';
import { CertificateIssuanceResult } from '../types';

const execAsync = promisify(exec);

export class AcmeService {
    private readonly acmeHome: string;
    private readonly certPath: string;
    private readonly webroot: string;
    private readonly acmeEmail: string;
    private readonly isProduction: boolean;

    constructor() {
        this.acmeHome = config.acme.home;
        this.certPath = config.ssl.certPath;
        this.webroot = config.ssl.acmeWebroot;
        this.acmeEmail = config.acme.email;
        this.isProduction = config.acme.directory.includes('acme-v02.api.letsencrypt.org');
    }

    /**
     * Issues an SSL certificate for a domain using acme.sh.
     * Uses HTTP-01 challenge via webroot method.
     * 
     * @param hostname - Domain to issue certificate for
     * @returns Issuance result with certificate paths
     * 
     * @example
     * const result = await acmeService.issueCertificate('shop.example.com');
     * if (result.success) {
     *   console.log('Certificate at:', result.certPath);
     * }
     */
    async issueCertificate(hostname: string): Promise<CertificateIssuanceResult> {
        const domainCertDir = path.join(this.certPath, hostname);

        try {
            // Ensure certificate directory exists
            await fs.mkdir(domainCertDir, { recursive: true });

            logger.info({ hostname, domainCertDir }, 'Issuing certificate via ACME');

            // Build acme.sh command
            const acmeCmd = this.buildAcmeCommand(hostname, domainCertDir);

            logger.debug({ command: acmeCmd }, 'Running acme.sh command');

            // Execute acme.sh
            const { stdout, stderr } = await execAsync(acmeCmd, {
                timeout: 120000,  // 2 minute timeout
                env: {
                    ...process.env,
                    LE_WORKING_DIR: this.acmeHome,
                },
            });

            logger.debug({ stdout, stderr }, 'acme.sh output');

            // Verify certificate files exist
            const certFile = path.join(domainCertDir, 'fullchain.pem');
            const keyFile = path.join(domainCertDir, 'privkey.pem');

            await Promise.all([
                fs.access(certFile),
                fs.access(keyFile),
            ]);

            // Parse certificate expiry date
            const expiresAt = await this.getCertificateExpiry(certFile);

            logger.info({
                hostname,
                certFile,
                expiresAt
            }, 'Certificate issued successfully');

            return {
                success: true,
                certPath: certFile,
                keyPath: keyFile,
                expiresAt,
            };

        } catch (error) {
            const err = error as { stderr?: string; message: string };
            const errorMessage = err.stderr || err.message;

            logger.error({
                hostname,
                error: errorMessage,
            }, 'Certificate issuance failed');

            // Try to parse common ACME errors
            const friendlyError = this.parseAcmeError(errorMessage);

            return {
                success: false,
                error: friendlyError,
            };
        }
    }

    /**
     * Renews a certificate that's nearing expiry.
     * 
     * @param hostname - Domain to renew
     * @param force - Force renewal even if not expiring soon
     */
    async renewCertificate(
        hostname: string,
        force: boolean = false
    ): Promise<CertificateIssuanceResult> {
        const domainCertDir = path.join(this.certPath, hostname);

        try {
            logger.info({ hostname, force }, 'Renewing certificate');

            // Build renewal command
            let acmeCmd = `${this.acmeHome}/acme.sh --renew -d ${hostname}`;

            if (force) {
                acmeCmd += ' --force';
            }

            // Add server flag for staging
            if (!this.isProduction) {
                acmeCmd += ' --staging';
            }

            const { stdout, stderr } = await execAsync(acmeCmd, {
                timeout: 120000,
                env: {
                    ...process.env,
                    LE_WORKING_DIR: this.acmeHome,
                },
            });

            logger.debug({ stdout, stderr }, 'acme.sh renewal output');

            // Install renewed certificate
            await this.installCertificate(hostname, domainCertDir);

            const certFile = path.join(domainCertDir, 'fullchain.pem');
            const keyFile = path.join(domainCertDir, 'privkey.pem');
            const expiresAt = await this.getCertificateExpiry(certFile);

            logger.info({ hostname, expiresAt }, 'Certificate renewed successfully');

            return {
                success: true,
                certPath: certFile,
                keyPath: keyFile,
                expiresAt,
            };

        } catch (error) {
            const err = error as { stderr?: string; message: string };
            const errorMessage = err.stderr || err.message;

            logger.error({ hostname, error: errorMessage }, 'Certificate renewal failed');

            return {
                success: false,
                error: this.parseAcmeError(errorMessage),
            };
        }
    }

    /**
     * Revokes a certificate (used when domain is deleted).
     * 
     * @param hostname - Domain whose certificate to revoke
     */
    async revokeCertificate(hostname: string): Promise<boolean> {
        try {
            const acmeCmd = `${this.acmeHome}/acme.sh --revoke -d ${hostname}`;

            await execAsync(acmeCmd, {
                timeout: 60000,
                env: { ...process.env, LE_WORKING_DIR: this.acmeHome },
            });

            logger.info({ hostname }, 'Certificate revoked');
            return true;

        } catch (error) {
            logger.error({ hostname, error }, 'Certificate revocation failed');
            return false;
        }
    }

    /**
     * Builds the acme.sh command for certificate issuance.
     */
    private buildAcmeCommand(hostname: string, destDir: string): string {
        const parts = [
            `${this.acmeHome}/acme.sh`,
            '--issue',
            `-d ${hostname}`,
            `-w ${this.webroot}`,
            '--keylength 2048',
        ];

        // Use staging server for non-production
        if (!this.isProduction) {
            parts.push('--staging');
        }

        // Add install step to copy certs to our directory
        parts.push(
            '&&',
            `${this.acmeHome}/acme.sh`,
            '--install-cert',
            `-d ${hostname}`,
            `--key-file ${destDir}/privkey.pem`,
            `--fullchain-file ${destDir}/fullchain.pem`,
        );

        return parts.join(' ');
    }

    /**
     * Installs a certificate to the specified directory.
     */
    private async installCertificate(hostname: string, destDir: string): Promise<void> {
        const installCmd = [
            `${this.acmeHome}/acme.sh`,
            '--install-cert',
            `-d ${hostname}`,
            `--key-file ${destDir}/privkey.pem`,
            `--fullchain-file ${destDir}/fullchain.pem`,
        ].join(' ');

        await execAsync(installCmd, {
            timeout: 30000,
            env: { ...process.env, LE_WORKING_DIR: this.acmeHome },
        });
    }

    /**
     * Gets the expiry date from a PEM certificate file.
     * Uses openssl to parse the certificate.
     */
    private async getCertificateExpiry(certFile: string): Promise<Date> {
        try {
            const { stdout } = await execAsync(
                `openssl x509 -enddate -noout -in ${certFile}`
            );

            // Output format: notAfter=Jan 15 00:00:00 2025 GMT
            const match = stdout.match(/notAfter=(.+)/);
            if (match) {
                return new Date(match[1]);
            }
        } catch (error) {
            logger.warn({ certFile, error }, 'Could not parse certificate expiry');
        }

        // Default to 90 days from now (Let's Encrypt default)
        return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    }

    /**
     * Parses acme.sh error output into a user-friendly message.
     */
    private parseAcmeError(errorOutput: string): string {
        const errors: Record<string, string> = {
            'DNS problem': 'DNS not configured correctly. Ensure your domain points to this server.',
            'Challenge failed': 'HTTP challenge failed. Ensure port 80 is accessible and webroot is configured.',
            'Timeout': 'Connection timed out. Check firewall settings.',
            'rate limit': 'Rate limit exceeded. Wait before trying again (usually 1 hour).',
            'unauthorized': 'Domain verification failed. Check DNS configuration.',
            'connection refused': 'Could not reach ACME server. Check network connectivity.',
            'invalid domain': 'Invalid domain name. Check the hostname.',
        };

        const lowerOutput = errorOutput.toLowerCase();

        for (const [pattern, message] of Object.entries(errors)) {
            if (lowerOutput.includes(pattern.toLowerCase())) {
                return message;
            }
        }

        // Return a truncated version of the raw error
        return errorOutput.substring(0, 200);
    }

    /**
     * Checks if acme.sh is installed and configured.
     */
    async checkInstallation(): Promise<boolean> {
        try {
            const { stdout } = await execAsync(`${this.acmeHome}/acme.sh --version`);
            logger.info({ version: stdout.trim() }, 'acme.sh version');
            return true;
        } catch {
            logger.warn('acme.sh not found or not configured');
            return false;
        }
    }
}
