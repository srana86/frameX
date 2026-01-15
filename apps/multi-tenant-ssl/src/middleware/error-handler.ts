// =============================================================================
// Error Handler Middleware
// =============================================================================
// Centralized error handling for the Express application.
// Catches all errors and returns consistent JSON responses.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@framex/database';
import { logger } from '../app';
import { ApiResponse } from '../types';
import { config } from '../config';

/**
 * Custom application error class.
 * Use this for business logic errors that should return specific HTTP status codes.
 */
export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }

    // Common error factory methods
    static badRequest(message: string, code?: string): AppError {
        return new AppError(400, message, code);
    }

    static unauthorized(message: string = 'Unauthorized'): AppError {
        return new AppError(401, message, 'UNAUTHORIZED');
    }

    static forbidden(message: string = 'Forbidden'): AppError {
        return new AppError(403, message, 'FORBIDDEN');
    }

    static notFound(resource: string = 'Resource'): AppError {
        return new AppError(404, `${resource} not found`, 'NOT_FOUND');
    }

    static conflict(message: string): AppError {
        return new AppError(409, message, 'CONFLICT');
    }

    static internal(message: string = 'Internal server error'): AppError {
        return new AppError(500, message, 'INTERNAL_ERROR');
    }
}

/**
 * Express error handling middleware.
 * Must be registered last in the middleware chain.
 * 
 * Handles:
 * - AppError: Custom application errors
 * - ZodError: Validation errors from Zod
 * - Prisma errors: Database constraint violations, etc.
 * - Unknown errors: Logged and returned as 500
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
): void {
    // ---------------------------------------------------------------------------
    // CUSTOM APPLICATION ERRORS
    // ---------------------------------------------------------------------------

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
            code: err.code,
        } as ApiResponse);
        return;
    }

    // ---------------------------------------------------------------------------
    // ZOD VALIDATION ERRORS
    // ---------------------------------------------------------------------------

    if (err instanceof ZodError) {
        const errors = err.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));

        res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: errors.map(e => `${e.field}: ${e.message}`).join(', '),
        } as ApiResponse);
        return;
    }

    // ---------------------------------------------------------------------------
    // PRISMA DATABASE ERRORS
    // ---------------------------------------------------------------------------

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            // Unique constraint violation
            case 'P2002': {
                const field = (err.meta?.target as string[])?.join(', ') || 'field';
                res.status(409).json({
                    success: false,
                    error: `A record with this ${field} already exists`,
                    code: 'DUPLICATE_ENTRY',
                } as ApiResponse);
                return;
            }

            // Record not found
            case 'P2025':
                res.status(404).json({
                    success: false,
                    error: 'Record not found',
                    code: 'NOT_FOUND',
                } as ApiResponse);
                return;

            // Foreign key constraint violation
            case 'P2003': {
                const field = (err.meta?.field_name as string) || 'reference';
                res.status(400).json({
                    success: false,
                    error: `Invalid ${field} reference`,
                    code: 'INVALID_REFERENCE',
                } as ApiResponse);
                return;
            }

            default:
                logger.error({
                    error: err,
                    code: err.code,
                    meta: err.meta
                }, 'Prisma error');
        }
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        res.status(400).json({
            success: false,
            error: 'Invalid data provided',
            code: 'VALIDATION_ERROR',
        } as ApiResponse);
        return;
    }

    // ---------------------------------------------------------------------------
    // UNKNOWN ERRORS
    // ---------------------------------------------------------------------------

    // Log the full error in development, minimal in production
    logger.error({
        error: err,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    }, 'Unhandled error');

    // Don't expose internal error details in production
    const message = config.nodeEnv === 'production'
        ? 'An unexpected error occurred'
        : err.message;

    res.status(500).json({
        success: false,
        error: message,
        ...(config.nodeEnv !== 'production' && { stack: err.stack }),
    } as ApiResponse);
}
