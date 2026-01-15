// =============================================================================
// Nginx Service
// =============================================================================
// Manages Nginx configuration for multi-tenant SSL.
// Handles dynamic configuration generation, testing, and graceful reloads.
// =============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import Mustache from 'mustache';
import { config } from '../config';
import { logger } from '../app';
import { NginxConfigResult, NginxReloadResult, NginxTemplateVars } from '../types';

const execAsync = promisify(exec);

// Disable Mustache HTML escaping
Mustache.escape = (text) => text;

export class NginxService {
    private readonly sitesPath: string;
    private readonly nginxBin: string;
    private readonly templatePath: string;

    constructor() {
        this.sitesPath = config.nginx.sitesPath;
        this.nginxBin = config.nginx.bin;
        // Template is stored in the nginx directory of this project
        this.templatePath = path.join(__dirname, '../../nginx/templates');
    }

    /**
     * Creates and saves Nginx configuration for a domain.
     * Uses a template file for consistency and maintainability.
     * 
     * @param vars - Template variables for the configuration
     * @returns Result with config file path
     * 
     * @example
     * await nginxService.createConfig({
     *   domain: 'shop.example.com',
     *   backendHost: 'localhost',
     *   backendPort: 3000,
     *   certPath: '/etc/ssl/tenants/shop.example.com/fullchain.pem',
     *   keyPath: '/etc/ssl/tenants/shop.example.com/privkey.pem',
     * });
     */
    async createConfig(vars: NginxTemplateVars): Promise<NginxConfigResult> {
        const configFileName = `${vars.domain}.conf`;
        const configPath = path.join(this.sitesPath, configFileName);

        try {
            // Load template
            const template = await this.loadTemplate('tenant.conf.mustache');

            // Render configuration
            const configContent = Mustache.render(template, {
                ...vars,
                // Add security headers
                securityHeaders: this.getSecurityHeaders(),
                // Enable WebSocket support
                websocketSupport: vars.enableWebSocket !== false,
            });

            // Write configuration file
            await fs.writeFile(configPath, configContent, 'utf8');

            // Test configuration before applying
            const testResult = await this.testConfig();
            if (!testResult.success) {
                // Remove invalid config
                await fs.unlink(configPath);
                return {
                    success: false,
                    error: `Invalid nginx config: ${testResult.error}`,
                    reloadRequired: false,
                };
            }

            logger.info({ domain: vars.domain, configPath }, 'Nginx config created');

            return {
                success: true,
                configPath,
                reloadRequired: true,
            };

        } catch (error) {
            const err = error as Error;
            logger.error({ domain: vars.domain, error: err.message }, 'Failed to create nginx config');

            return {
                success: false,
                error: err.message,
                reloadRequired: false,
            };
        }
    }

    /**
     * Removes Nginx configuration for a domain.
     * 
     * @param domain - Domain whose configuration to remove
     */
    async removeConfig(domain: string): Promise<NginxConfigResult> {
        const configPath = path.join(this.sitesPath, `${domain}.conf`);

        try {
            await fs.unlink(configPath);

            logger.info({ domain, configPath }, 'Nginx config removed');

            return {
                success: true,
                configPath,
                reloadRequired: true,
            };

        } catch (error) {
            const err = error as NodeJS.ErrnoException;

            // If file doesn't exist, that's fine
            if (err.code === 'ENOENT') {
                return {
                    success: true,
                    reloadRequired: false,
                };
            }

            logger.error({ domain, error: err.message }, 'Failed to remove nginx config');

            return {
                success: false,
                error: err.message,
                reloadRequired: false,
            };
        }
    }

    /**
     * Tests the Nginx configuration for syntax errors.
     * Should be called before reloading after any config changes.
     */
    async testConfig(): Promise<NginxReloadResult> {
        try {
            const { stdout, stderr } = await execAsync(`${this.nginxBin} -t`);

            // nginx -t outputs "syntax is ok" on success
            const output = stderr || stdout;

            if (output.includes('syntax is ok') || output.includes('successful')) {
                return { success: true, testOutput: output };
            }

            return {
                success: false,
                error: output,
                testOutput: output,
            };

        } catch (error) {
            const err = error as { stderr?: string; message: string };
            return {
                success: false,
                error: err.stderr || err.message,
                testOutput: err.stderr,
            };
        }
    }

    /**
     * Reloads Nginx configuration gracefully (zero downtime).
     * Uses SIGHUP signal which doesn't drop existing connections.
     */
    async reload(): Promise<NginxReloadResult> {
        try {
            // Test config first
            const testResult = await this.testConfig();
            if (!testResult.success) {
                return testResult;
            }

            // Graceful reload
            const { stdout, stderr } = await execAsync(`${this.nginxBin} -s reload`);

            logger.info('Nginx reloaded successfully');

            return {
                success: true,
                testOutput: stdout || stderr,
            };

        } catch (error) {
            const err = error as { stderr?: string; message: string };
            logger.error({ error: err.message }, 'Nginx reload failed');

            return {
                success: false,
                error: err.stderr || err.message,
            };
        }
    }

    /**
     * Lists all configured domains.
     * Parses config files in sites-enabled directory.
     */
    async listConfigs(): Promise<string[]> {
        try {
            const files = await fs.readdir(this.sitesPath);
            return files
                .filter(f => f.endsWith('.conf'))
                .map(f => f.replace('.conf', ''));
        } catch (error) {
            logger.error({ error }, 'Failed to list nginx configs');
            return [];
        }
    }

    /**
     * Checks if a domain has an existing configuration.
     */
    async hasConfig(domain: string): Promise<boolean> {
        const configPath = path.join(this.sitesPath, `${domain}.conf`);
        try {
            await fs.access(configPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Gets Nginx status (running or not).
     */
    async getStatus(): Promise<{ running: boolean; pid?: number }> {
        try {
            const { stdout } = await execAsync('pidof nginx');
            const pid = parseInt(stdout.trim().split(' ')[0], 10);
            return { running: true, pid };
        } catch {
            return { running: false };
        }
    }

    /**
     * Loads a template file from the templates directory.
     */
    private async loadTemplate(templateName: string): Promise<string> {
        const templateFile = path.join(this.templatePath, templateName);

        try {
            return await fs.readFile(templateFile, 'utf8');
        } catch {
            // Return inline template if file doesn't exist (for development)
            return this.getInlineTemplate();
        }
    }

    /**
     * Returns security headers configuration.
     */
    private getSecurityHeaders(): string {
        return `
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    `;
    }

    /**
     * Fallback inline template for when template file is not found.
     */
    private getInlineTemplate(): string {
        return `# Nginx configuration for {{domain}}
# Generated by multi-tenant-ssl service
# DO NOT EDIT MANUALLY

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name {{domain}}{{#additionalServerNames}} {{.}}{{/additionalServerNames}};

    # SSL Certificate
    ssl_certificate {{certPath}};
    ssl_certificate_key {{keyPath}};

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;

    {{{securityHeaders}}}

    # Proxy settings
    location / {
        proxy_pass http://{{backendHost}}:{{backendPort}};
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        {{#websocketSupport}}
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        {{/websocketSupport}}
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location /nginx-health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }

    # Deny access to hidden files
    location ~ /\\. {
        deny all;
        return 404;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name {{domain}}{{#additionalServerNames}} {{.}}{{/additionalServerNames}};

    # ACME challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/acme;
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
`;
    }
}
