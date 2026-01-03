/**
 * Environment Variables Utility
 * Helper functions to get data based on .env file
 */

import { getEnvData, getEnvValue, getAllEnvVars } from "./env-loader";

/**
 * Get encryption key from .env
 */
export function getEncryptionKey(): string {
  return getEnvValue("ENCRYPTION_KEY") || "";
}

/**
 * Get GitHub repository from .env
 */
export function getGitHubRepo(): string {
  return getEnvValue("GITHUB_REPO") || "";
}

/**
 * Get GitHub token from .env
 */
export function getGitHubToken(): string {
  return getEnvValue("GITHUB_TOKEN") || "";
}

/**
 * Get MongoDB database name from .env
 */
export function getMongoDbName(): string {
  return getEnvValue("MONGODB_DB") || "shoestore_main";
}

/**
 * Get merchant database name from .env
 */
export function getMerchantDbName(): string | undefined {
  return getEnvValue("MERCHANT_DB_NAME") || process.env.MERCHANT_DB_NAME;
}

/**
 * Get merchant ID from .env
 */
export function getMerchantId(): string | undefined {
  return getEnvValue("MERCHANT_ID") || process.env.MERCHANT_ID;
}

/**
 * Get all environment data from .env lines 12-16
 */
export function getEnvConfig() {
  return getEnvData();
}

/**
 * Get complete environment configuration
 */
export function getCompleteEnvConfig() {
  return getAllEnvVars();
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(): { valid: boolean; missing: string[] } {
  const required = ["ENCRYPTION_KEY", "MONGODB_DB"];
  const missing: string[] = [];
  
  const config = getEnvData();
  
  for (const key of required) {
    if (!config[key] && !process.env[key]) {
      missing.push(key);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

