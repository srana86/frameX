// =============================================================================
// Authentication Middleware
// =============================================================================
// Protects API routes using API key authentication.
// In production, this can be extended to support JWT, OAuth, etc.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { ApiResponse } from '../types';

/**
 * Express middleware that validates API key authentication.
 * 
 * The API key can be provided in two ways:
 * 1. X-API-Key header (recommended)
 * 2. Authorization: Bearer <api-key> header
 * 
 * @example
 * // Using X-API-Key header
 * curl -H "X-API-Key: your-api-key" http://localhost:3000/api/v1/domains
 * 
 * // Using Authorization header
 * curl -H "Authorization: Bearer your-api-key" http://localhost:3000/api/v1/domains
 */
export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Get API key from headers
    const apiKeyHeader = req.get('X-API-Key');
    const authHeader = req.get('Authorization');

    let providedKey: string | undefined;

    // Check X-API-Key header first
    if (apiKeyHeader) {
        providedKey = apiKeyHeader;
    }
    // Fall back to Authorization header
    else if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
            providedKey = parts[1];
        }
    }

    // No API key provided
    if (!providedKey) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Provide API key via X-API-Key or Authorization header',
        } as ApiResponse);
        return;
    }

    // Validate API key using timing-safe comparison
    // This prevents timing attacks that could guess the API key
    if (!timingSafeEqual(providedKey, config.apiKey)) {
        res.status(403).json({
            success: false,
            error: 'Invalid API key',
        } as ApiResponse);
        return;
    }

    // API key is valid, continue to route handler
    next();
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 * 
 * A regular === comparison returns as soon as a mismatch is found,
 * which can leak information about how many characters match.
 * This function always compares all characters regardless of mismatches.
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        // Still need to do some work to prevent length-based timing attacks
        // Compare against a dummy string of same length as 'a'
        b = a;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0 && a.length === b.length;
}

/**
 * Optional: JWT authentication middleware for admin users.
 * This can be used alongside API key auth for different access levels.
 */
export function jwtAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // TODO: Implement JWT validation if needed
    // For now, this is a placeholder that always passes
    // In production, validate JWT token and attach user to req
    next();
}
