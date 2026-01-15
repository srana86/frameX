// =============================================================================
// Configuration Module
// =============================================================================
// Centralizes all environment configuration with validation and defaults.
// Uses Zod for runtime type checking of environment variables.
// =============================================================================

import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

// =============================================================================
// CONFIGURATION SCHEMA
// =============================================================================
// Defines the structure and validation rules for all config values
// =============================================================================

const configSchema = z.object({
    // Server settings
    port: z.coerce.number().default(3000),
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

    // Database
    databaseUrl: z.string().url(),

    // Redis
    redisUrl: z.string().url().default('redis://localhost:6379'),

    // ACME / Let's Encrypt
    acme: z.object({
        email: z.string().email(),
        directory: z.string().url().default('https://acme-staging-v02.api.letsencrypt.org/directory'),
        home: z.string().default('/root/.acme.sh'),
    }),

    // Nginx
    nginx: z.object({
        sitesPath: z.string().default('/etc/nginx/sites-enabled'),
        bin: z.string().default('/usr/sbin/nginx'),
        testCmd: z.string().default('nginx -t'),
        reloadCmd: z.string().default('nginx -s reload'),
    }),

    // SSL
    ssl: z.object({
        certPath: z.string().default('/etc/ssl/tenants'),
        acmeWebroot: z.string().default('/var/www/acme'),
        renewalDays: z.coerce.number().default(30),
    }),

    // Cloudflare (optional)
    cloudflare: z.object({
        apiToken: z.string().optional(),
        zoneId: z.string().optional(),
    }),

    // API Security
    apiKey: z.string().min(16),
    jwtSecret: z.string().min(32),

    // Notifications (optional)
    notifications: z.object({
        slackWebhookUrl: z.string().url().optional(),
        smtp: z.object({
            host: z.string().optional(),
            port: z.coerce.number().optional(),
            user: z.string().optional(),
            pass: z.string().optional(),
        }),
        email: z.string().email().optional(),
    }),
});

// =============================================================================
// CONFIGURATION LOADER
// =============================================================================
// Validates and exports the configuration object
// =============================================================================

function loadConfig() {
    const rawConfig = {
        port: process.env.PORT,
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL,
        redisUrl: process.env.REDIS_URL,

        acme: {
            email: process.env.ACME_EMAIL,
            directory: process.env.ACME_DIRECTORY,
            home: process.env.ACME_HOME,
        },

        nginx: {
            sitesPath: process.env.NGINX_SITES_PATH,
            bin: process.env.NGINX_BIN,
            testCmd: process.env.NGINX_TEST_CMD || 'nginx -t',
            reloadCmd: process.env.NGINX_RELOAD_CMD || 'nginx -s reload',
        },

        ssl: {
            certPath: process.env.SSL_CERT_PATH,
            acmeWebroot: process.env.ACME_WEBROOT,
            renewalDays: process.env.CERT_RENEWAL_DAYS,
        },

        cloudflare: {
            apiToken: process.env.CLOUDFLARE_API_TOKEN,
            zoneId: process.env.CLOUDFLARE_ZONE_ID,
        },

        apiKey: process.env.API_KEY,
        jwtSecret: process.env.JWT_SECRET,

        notifications: {
            slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
            smtp: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            email: process.env.NOTIFICATION_EMAIL,
        },
    };

    try {
        return configSchema.parse(rawConfig);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Configuration validation failed:');
            error.issues.forEach((err) => {
                console.error(`   - ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
}

// Export validated configuration
export const config = loadConfig();

// Export type for use in other modules
export type Config = z.infer<typeof configSchema>;
