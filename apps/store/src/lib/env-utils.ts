/**
 * Environment Variables Utility
 * Simple helper functions to access environment variables
 * Next.js automatically loads from .env.local, .env, etc.
 */

export function getEncryptionKey(): string {
  return process.env.ENCRYPTION_KEY || "";
}

export function getGitHubRepo(): string {
  return process.env.GITHUB_REPO || "";
}

export function getGitHubToken(): string {
  return process.env.GITHUB_TOKEN || "";
}

export function getMongoDbName(): string {
  return process.env.MONGODB_DB || "shoestore_main";
}

export function getTenantDbName(): string | undefined {
  return process.env.TENANT_DB_NAME;
}

export function getTenantId(): string | undefined {
  return process.env.TENANT_ID;
}

export function getEnvConfig() {
  return {
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    MONGODB_DB: process.env.MONGODB_DB,
    TENANT_DB_NAME: process.env.TENANT_DB_NAME,
    TENANT_ID: process.env.TENANT_ID,
  };
}

export function validateEnvVars(): { valid: boolean; missing: string[] } {
  const required = ["ENCRYPTION_KEY", "MONGODB_DB"];
  const missing = required.filter((key) => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}
