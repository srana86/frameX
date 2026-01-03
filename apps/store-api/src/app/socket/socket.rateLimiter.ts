/**
 * In-memory rate limiter for socket events
 * In production, this should use Redis for distributed rate limiting
 */
class SocketRateLimiter {
  private eventCounts: Map<string, { count: number; resetAt: number }> =
    new Map();
  private readonly WINDOW_MS = 60000; // 1 minute
  private readonly MAX_EVENTS_PER_WINDOW = 100; // Max 100 events per minute per socket

  /**
   * Check if socket has exceeded rate limit
   * @param socketId - Socket ID
   * @returns true if rate limit exceeded, false otherwise
   */
  checkRateLimit(socketId: string): boolean {
    const now = Date.now();
    const key = socketId;
    const record = this.eventCounts.get(key);

    // If no record or window expired, reset
    if (!record || now > record.resetAt) {
      this.eventCounts.set(key, {
        count: 1,
        resetAt: now + this.WINDOW_MS,
      });
      return false;
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > this.MAX_EVENTS_PER_WINDOW) {
      return true;
    }

    return false;
  }

  /**
   * Reset rate limit for a socket (call on disconnect)
   */
  reset(socketId: string): void {
    this.eventCounts.delete(socketId);
  }

  /**
   * Clear all rate limits (useful for testing)
   */
  clear(): void {
    this.eventCounts.clear();
  }
}

export const socketRateLimiter = new SocketRateLimiter();
