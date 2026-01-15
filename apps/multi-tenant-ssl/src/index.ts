// =============================================================================
// Application Entry Point
// =============================================================================
// Starts the Express server and initializes background workers for
// certificate renewal and domain health monitoring.
// =============================================================================

import { createApp, prisma, logger } from './app';
import { config } from './config';
import { startWorkers, stopWorkers } from './workers';

// =============================================================================
// MAIN STARTUP FUNCTION
// =============================================================================

async function main() {
    // Banner
    logger.info('');
    logger.info('======================================================');
    logger.info('  Multi-Tenant SSL Management Service');
    logger.info('======================================================');
    logger.info('');

    // ---------------------------------------------------------------------------
    // DATABASE CONNECTION
    // ---------------------------------------------------------------------------

    logger.info('🔌 Connecting to database...');
    try {
        await prisma.$connect();
        logger.info('✅ Database connected');
    } catch (error) {
        logger.error({ error }, '❌ Failed to connect to database');
        process.exit(1);
    }

    // ---------------------------------------------------------------------------
    // CREATE EXPRESS APP
    // ---------------------------------------------------------------------------

    const app = createApp();

    // ---------------------------------------------------------------------------
    // START BACKGROUND WORKERS
    // ---------------------------------------------------------------------------

    logger.info('🔧 Starting background workers...');
    try {
        await startWorkers();
        logger.info('✅ Background workers started');
    } catch (error) {
        logger.error({ error }, '⚠️ Failed to start some workers (continuing anyway)');
    }

    // ---------------------------------------------------------------------------
    // START HTTP SERVER
    // ---------------------------------------------------------------------------

    const server = app.listen(config.port, () => {
        logger.info('');
        logger.info(`🚀 Server running on port ${config.port}`);
        logger.info(`   Environment: ${config.nodeEnv}`);
        logger.info(`   Health check: http://localhost:${config.port}/health`);
        logger.info(`   API base: http://localhost:${config.port}/api/v1`);
        logger.info('');
        logger.info('📋 Available endpoints:');
        logger.info('   GET  /health                         - Health check');
        logger.info('   GET  /api/v1/domains                 - List domains');
        logger.info('   POST /api/v1/domains                 - Create domain');
        logger.info('   GET  /api/v1/domains/:id             - Get domain');
        logger.info('   DELETE /api/v1/domains/:id           - Delete domain');
        logger.info('   POST /api/v1/domains/:id/verify      - Verify DNS');
        logger.info('   POST /api/v1/domains/:id/issue-cert  - Issue SSL');
        logger.info('   GET  /api/v1/tenants                 - List tenants');
        logger.info('   POST /api/v1/tenants                 - Create tenant');
        logger.info('');
    });

    // ---------------------------------------------------------------------------
    // GRACEFUL SHUTDOWN
    // ---------------------------------------------------------------------------

    const shutdown = async (signal: string) => {
        logger.info(`\n🛑 Received ${signal}, shutting down gracefully...`);

        // Stop accepting new connections
        server.close(async () => {
            logger.info('   HTTP server closed');

            // Stop background workers
            try {
                await stopWorkers();
                logger.info('   Background workers stopped');
            } catch (error) {
                logger.error({ error }, '   Error stopping workers');
            }

            // Disconnect from database
            try {
                await prisma.$disconnect();
                logger.info('   Database disconnected');
            } catch (error) {
                logger.error({ error }, '   Error disconnecting from database');
            }

            logger.info('👋 Goodbye!');
            process.exit(0);
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
            logger.error('⚠️ Forced shutdown after timeout');
            process.exit(1);
        }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger.error({ error }, '💥 Uncaught exception');
        shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error({ reason, promise }, '💥 Unhandled rejection');
    });
}

// =============================================================================
// RUN
// =============================================================================

main().catch((error) => {
    logger.error({ error }, 'Failed to start application');
    process.exit(1);
});
