import { NextResponse } from "next/server";
import { getEnvConfig, getCompleteEnvConfig, validateEnvVars } from "@/lib/env-utils";

/**
 * GET /api/env/config
 * Get environment variables from .env file (lines 12-16)
 */
export async function GET() {
  try {
    // Get data from .env lines 12-16
    const envData = getEnvConfig();
    
    // Validate required variables
    const validation = validateEnvVars();
    
    // Get complete config (includes all env vars)
    const completeConfig = getCompleteEnvConfig();
    
    return NextResponse.json({
      success: true,
      data: {
        // Data from .env lines 12-16
        envLines12to16: {
          ENCRYPTION_KEY: envData.ENCRYPTION_KEY ? "***" : undefined, // Masked for security
          GITHUB_REPO: envData.GITHUB_REPO,
          GITHUB_TOKEN: envData.GITHUB_TOKEN ? "***" : undefined, // Masked for security
          MONGODB_DB: envData.MONGODB_DB,
        },
        // Validation status
        validation,
        // All environment variables (masked sensitive data)
        allEnvVars: {
          ...completeConfig,
          ENCRYPTION_KEY: completeConfig.ENCRYPTION_KEY ? "***" : undefined,
          GITHUB_TOKEN: completeConfig.GITHUB_TOKEN ? "***" : undefined,
          JWT_SECRET: completeConfig.JWT_SECRET ? "***" : undefined,
          VERCEL_TOKEN: completeConfig.VERCEL_TOKEN ? "***" : undefined,
          CLOUDINARY_API_SECRET: completeConfig.CLOUDINARY_API_SECRET ? "***" : undefined,
          MONGODB_URI: completeConfig.MONGODB_URI ? completeConfig.MONGODB_URI.replace(/:[^:@]+@/, ":****@") : undefined,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load environment variables" },
      { status: 500 }
    );
  }
}

