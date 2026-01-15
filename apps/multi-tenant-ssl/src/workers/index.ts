// =============================================================================
// Background Workers
// =============================================================================
// Manages background jobs for certificate renewal and domain health monitoring.
// Uses BullMQ for job queue management with Redis backend.
// =============================================================================

import { Queue, Worker, Job } from 'bullmq';
import { Processor } from 'bullmq';
import Redis from 'ioredis';
import cron from 'node-cron';
import { config } from '../config';
import { logger, prisma } from '../app';
import { DomainService } from '../services/domain.service';
import { AcmeService } from '../services/acme.service';
import { NginxService } from '../services/nginx.service';
import { CertRenewalJobData, CertJobResult, DomainHealthJobData } from '../types';

// Redis connection for BullMQ
let redis: Redis | null = null;

// Queues
let certRenewalQueue: Queue<CertRenewalJobData> | null = null;
let domainHealthQueue: Queue<DomainHealthJobData> | null = null;

// Workers
let certRenewalWorker: Worker<CertRenewalJobData, CertJobResult> | null = null;
let domainHealthWorker: Worker<DomainHealthJobData, void> | null = null;

// Cron jobs
const cronJobs: cron.ScheduledTask[] = [];

// Services
const domainService = new DomainService(prisma);
const acmeService = new AcmeService();
const nginxService = new NginxService();

// =============================================================================
// WORKER INITIALIZATION
// =============================================================================

/**
 * Starts all background workers and cron jobs.
 * Should be called during application startup.
 */
export async function startWorkers(): Promise<void> {
    try {
        // Connect to Redis
        redis = new Redis(config.redisUrl, {
            maxRetriesPerRequest: null,  // Required by BullMQ
            enableReadyCheck: false,
        });

        await redis.ping();
        logger.info('Redis connected for workers');

        // Initialize queues
        const queueOptions = { connection: redis };

        certRenewalQueue = new Queue('cert-renewal', queueOptions);
        domainHealthQueue = new Queue('domain-health', queueOptions);

        // Start workers
        certRenewalWorker = new Worker(
            'cert-renewal',
            processCertRenewal as Processor<CertRenewalJobData, CertJobResult>,
            { connection: redis, concurrency: 2 }
        );

        domainHealthWorker = new Worker(
            'domain-health',
            processDomainHealth as Processor<DomainHealthJobData, void>,
            { connection: redis, concurrency: 5 }
        );

        // Set up worker event handlers
        setupWorkerEvents(certRenewalWorker, 'cert-renewal');
        setupWorkerEvents(domainHealthWorker, 'domain-health');

        // Start cron jobs
        startCronJobs();

        logger.info('Background workers started');

    } catch (error) {
        logger.error({ error }, 'Failed to start workers');
        // Don't throw - allow app to run without workers
    }
}

/**
 * Stops all background workers gracefully.
 * Should be called during application shutdown.
 */
export async function stopWorkers(): Promise<void> {
    // Stop cron jobs
    cronJobs.forEach(job => job.stop());
    cronJobs.length = 0;

    // Close workers
    if (certRenewalWorker) {
        await certRenewalWorker.close();
    }
    if (domainHealthWorker) {
        await domainHealthWorker.close();
    }

    // Close queues
    if (certRenewalQueue) {
        await certRenewalQueue.close();
    }
    if (domainHealthQueue) {
        await domainHealthQueue.close();
    }

    // Close Redis
    if (redis) {
        await redis.quit();
    }

    logger.info('Background workers stopped');
}

// =============================================================================
// CERTIFICATE RENEWAL PROCESSOR
// =============================================================================

/**
 * Processes a certificate renewal job.
 * Attempts to renew the certificate using ACME.
 */
async function processCertRenewal(
    job: Job<CertRenewalJobData>
): Promise<CertJobResult> {
    const { domainId, hostname, forceRenewal } = job.data;

    logger.info({ jobId: job.id, hostname }, 'Processing certificate renewal');

    try {
        // Get domain record
        const domain = await prisma.tenantDomain.findUnique({
            where: { id: domainId },
            include: { tenant: true },
        });

        if (!domain || domain.deletedAt) {
            return {
                success: false,
                domainId,
                hostname,
                error: 'Domain not found or deleted',
            };
        }

        // Renew certificate
        const result = await acmeService.renewCertificate(hostname, forceRenewal);

        if (result.success) {
            // Update domain record
            await prisma.tenantDomain.update({
                where: { id: domainId },
                data: {
                    sslStatus: 'ACTIVE',
                    certPath: result.certPath,
                    keyPath: result.keyPath,
                    certExpiresAt: result.expiresAt,
                    lastRenewalAttempt: new Date(),
                    lastRenewalError: null,
                    renewalAttempts: 0,
                },
            });

            // Create new certificate record
            await prisma.domainCertificate.create({
                data: {
                    domainId,
                    issuer: 'Let\'s Encrypt',
                    commonName: hostname,
                    altNames: [hostname],
                    issuedAt: new Date(),
                    expiresAt: result.expiresAt!,
                    isActive: true,
                },
            });

            // Deactivate old certificates
            await prisma.domainCertificate.updateMany({
                where: {
                    domainId,
                    expiresAt: { lt: result.expiresAt! },
                    isActive: true,
                },
                data: { isActive: false },
            });

            // Reload Nginx to pick up new certificate
            await nginxService.reload();

            // Audit log
            await prisma.domainAuditLog.create({
                data: {
                    action: 'CERT_RENEWED',
                    entityType: 'Domain',
                    entityId: domainId,
                    actorType: 'worker',
                    details: { newExpiry: result.expiresAt },
                },
            });

            logger.info({
                hostname,
                newExpiry: result.expiresAt
            }, 'Certificate renewed successfully');

            return {
                success: true,
                domainId,
                hostname,
                newExpiryDate: result.expiresAt,
            };

        } else {
            // Renewal failed
            await prisma.tenantDomain.update({
                where: { id: domainId },
                data: {
                    sslStatus: 'RENEWAL_FAILED',
                    lastRenewalAttempt: new Date(),
                    lastRenewalError: result.error,
                    renewalAttempts: { increment: 1 },
                },
            });

            // Audit log
            await prisma.domainAuditLog.create({
                data: {
                    action: 'CERT_RENEWAL_FAILED',
                    entityType: 'Domain',
                    entityId: domainId,
                    actorType: 'worker',
                    success: false,
                    errorMessage: result.error,
                },
            });

            logger.error({ hostname, error: result.error }, 'Certificate renewal failed');

            return {
                success: false,
                domainId,
                hostname,
                error: result.error,
            };
        }

    } catch (error) {
        const err = error as Error;
        logger.error({ hostname, error: err.message }, 'Certificate renewal job error');

        return {
            success: false,
            domainId,
            hostname,
            error: err.message,
        };
    }
}

// =============================================================================
// DOMAIN HEALTH PROCESSOR
// =============================================================================

/**
 * Checks domain health (accessibility, SSL validity).
 */
async function processDomainHealth(
    job: Job<DomainHealthJobData>
): Promise<void> {
    const { domainId, hostname } = job.data;

    logger.debug({ jobId: job.id, hostname }, 'Checking domain health');

    try {
        // Simple HTTPS check
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`https://${hostname}/nginx-health`, {
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
            logger.debug({ hostname, status: response.status }, 'Domain healthy');
        } else {
            logger.warn({ hostname, status: response.status }, 'Domain returned non-OK status');
        }

    } catch (error) {
        const err = error as Error;
        logger.warn({ hostname, error: err.message }, 'Domain health check failed');
        // Don't fail the job - just log the issue
    }
}

// =============================================================================
// CRON JOBS
// =============================================================================

/**
 * Starts scheduled cron jobs for maintenance tasks.
 */
function startCronJobs(): void {
    // Daily: Queue certificate renewals for domains expiring within 30 days
    // Runs at 2 AM every day
    const renewalJob = cron.schedule('0 2 * * *', async () => {
        logger.info('Running daily certificate renewal check');

        try {
            const domains = await domainService.findDomainsNeedingRenewal(30);

            for (const domain of domains) {
                await certRenewalQueue?.add(
                    `renew-${domain.hostname}`,
                    {
                        domainId: domain.id,
                        hostname: domain.hostname,
                    },
                    {
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 60000,  // 1 minute initial delay
                        },
                    }
                );
            }

            logger.info({ count: domains.length }, 'Queued domains for renewal');

        } catch (error) {
            logger.error({ error }, 'Certificate renewal cron failed');
        }
    });

    cronJobs.push(renewalJob);

    // Hourly: Update expiry status for domains
    const expiryJob = cron.schedule('0 * * * *', async () => {
        logger.debug('Updating certificate expiry status');

        try {
            const updated = await domainService.updateExpiryStatus();
            if (updated > 0) {
                logger.info({ count: updated }, 'Updated expiry status for domains');
            }
        } catch (error) {
            logger.error({ error }, 'Expiry status update failed');
        }
    });

    cronJobs.push(expiryJob);

    // Every 5 minutes: Queue domain health checks (sample)
    const healthJob = cron.schedule('*/5 * * * *', async () => {
        // Only check a sample of domains to avoid overwhelming the system
        try {
            const domains = await prisma.tenantDomain.findMany({
                where: { status: 'ACTIVE', deletedAt: null },
                take: 10,
                orderBy: { updatedAt: 'asc' },  // Check least recently updated
            });

            for (const domain of domains) {
                await domainHealthQueue?.add(
                    `health-${domain.hostname}`,
                    {
                        domainId: domain.id,
                        hostname: domain.hostname,
                    },
                    { removeOnComplete: true, removeOnFail: true }
                );
            }

        } catch (error) {
            logger.error({ error }, 'Domain health check cron failed');
        }
    });

    cronJobs.push(healthJob);

    logger.info('Cron jobs scheduled');
}

// =============================================================================
// WORKER EVENT HANDLERS
// =============================================================================

/**
 * Sets up event handlers for a worker.
 */
function setupWorkerEvents(worker: Worker, name: string): void {
    worker.on('completed', (job) => {
        logger.debug({ queue: name, jobId: job?.id }, 'Job completed');
    });

    worker.on('failed', (job, error) => {
        logger.error({ queue: name, jobId: job?.id, error }, 'Job failed');
    });

    worker.on('error', (error) => {
        logger.error({ queue: name, error }, 'Worker error');
    });
}

// =============================================================================
// MANUAL JOB QUEUEING
// =============================================================================

/**
 * Queues a certificate renewal job manually.
 * Can be called from API endpoints.
 */
export async function queueCertRenewal(
    domainId: string,
    hostname: string,
    forceRenewal: boolean = false
): Promise<boolean> {
    if (!certRenewalQueue) {
        logger.warn('Certificate renewal queue not available');
        return false;
    }

    await certRenewalQueue.add(
        `renew-${hostname}`,
        { domainId, hostname, forceRenewal },
        {
            attempts: 3,
            backoff: { type: 'exponential', delay: 60000 },
        }
    );

    return true;
}
