import { createClient, RedisClientType } from "redis";
import config from "../config";

/**
 * Redis client for BetterAuth session storage
 * Reuses existing Redis configuration from environment
 */

// Build Redis URL from config
const getRedisUrl = (): string => {
    if (config.redis_url) return config.redis_url;
    const host = config.redis_host || "localhost";
    const port = config.redis_port || "6379";
    return `redis://${host}:${port}`;
};

// Create Redis client
export const redis: RedisClientType = createClient({
    url: getRedisUrl(),
    password: config.redis_password || undefined,
});

redis.on("error", (err) => console.error("❌ [Redis] BetterAuth Error:", err));
redis.on("connect", () => console.log("✅ [Redis] Connected for BetterAuth sessions"));

/**
 * Connect to Redis - call this during server startup
 */
export const connectRedis = async (): Promise<void> => {
    if (!redis.isOpen) {
        await redis.connect();
    }
};

/**
 * Disconnect from Redis - call this during server shutdown
 */
export const disconnectRedis = async (): Promise<void> => {
    if (redis.isOpen) {
        await redis.quit();
    }
};

export default redis;