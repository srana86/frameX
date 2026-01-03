/**
 * Environment Variable Loader
 * Reads specific environment variables from .env file
 */

import * as fs from "fs";
import * as path from "path";

export interface EnvConfig {
  ENCRYPTION_KEY?: string;
  GITHUB_REPO?: string;
  GITHUB_TOKEN?: string;
  MONGODB_DB?: string;
  MERCHANT_DB_NAME?: string;
  MERCHANT_ID?: string;
  [key: string]: string | undefined;
}

/**
 * Load environment variables from .env file (lines 11-15 by default)
 * Returns the values for: ENCRYPTION_KEY, GITHUB_REPO, GITHUB_TOKEN, MONGODB_DB, MERCHANT_DB_NAME, MERCHANT_ID
 */
export function loadEnvFromFile(lines?: { start: number; end: number }): EnvConfig {
  const envPath = path.resolve(process.cwd(), ".env");
  const config: EnvConfig = {};

  if (!fs.existsSync(envPath)) {
    console.warn("⚠️  .env file not found. Using process.env directly.");
    return {
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
      GITHUB_REPO: process.env.GITHUB_REPO,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      MONGODB_DB: process.env.MONGODB_DB,
      MERCHANT_DB_NAME: process.env.MERCHANT_DB_NAME,
      MERCHANT_ID: process.env.MERCHANT_ID,
    };
  }

  try {
    const envFile = fs.readFileSync(envPath, "utf-8");
    const linesArray = envFile.split("\n");

    // Default to lines 11-15 (0-indexed: 10-14)
    const startLine = (lines?.start ?? 11) - 1; // Convert to 0-indexed
    const endLine = lines?.end ?? 15;

    // Read specific lines
    for (let i = startLine; i < endLine && i < linesArray.length; i++) {
      const line = linesArray[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith("#")) {
        continue;
      }

      // Parse KEY=VALUE format
      const equalIndex = line.indexOf("=");
      if (equalIndex === -1) {
        continue;
      }

      const key = line.substring(0, equalIndex).trim();
      let value = line.substring(equalIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Set in config (prioritize .env file over process.env)
      if (key && value) {
        config[key] = value;
        // Also set in process.env if not already set
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }

    return config;
  } catch (error) {
    console.error("Error reading .env file:", error);
    return {
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
      GITHUB_REPO: process.env.GITHUB_REPO,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      MONGODB_DB: process.env.MONGODB_DB,
      MERCHANT_DB_NAME: process.env.MERCHANT_DB_NAME,
      MERCHANT_ID: process.env.MERCHANT_ID,
    };
  }
}

/**
 * Get environment variables from lines 11-15 of .env file
 */
export function getEnvData(): EnvConfig {
  return loadEnvFromFile({ start: 11, end: 15 });
}

/**
 * Get specific environment variable value
 */
export function getEnvValue(key: string): string | undefined {
  const config = getEnvData();
  return config[key] || process.env[key];
}

/**
 * Get all environment variables as an object
 */
export function getAllEnvVars(): Record<string, string | undefined> {
  const config = getEnvData();
  return {
    ...config,
    // Include other common env vars
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    VERCEL_TOKEN: process.env.VERCEL_TOKEN,
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
    SUPER_ADMIN_URL: process.env.SUPER_ADMIN_URL,
  };
}
