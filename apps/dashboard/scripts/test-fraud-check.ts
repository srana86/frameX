/**
 * Test script for Fraud Check API
 * Tests the fraud check functionality with phone number 01303463436
 *
 * Usage:
 *   tsx scripts/test-fraud-check.ts
 *   or
 *   bun run scripts/test-fraud-check.ts
 */

import * as fs from "fs";
import * as path from "path";
import { createFraudShieldClient } from "../src/lib/fraud-check/fraudshield-api";
import { normalizeBDPhone, BD_PHONE_REGEX } from "../src/lib/fraud-check/common";

// Load environment variables from .env file
function loadEnvFile() {
  // Get script directory (works with both Bun and Node.js)
  let scriptDir: string;
  try {
    // Bun/Node.js ESM
    if (typeof import.meta !== "undefined" && import.meta.url) {
      scriptDir = path.dirname(new URL(import.meta.url).pathname);
    } else {
      // Fallback for CommonJS
      scriptDir = __dirname;
    }
  } catch {
    // Fallback if neither works
    scriptDir = process.cwd();
  }

  const projectRoot = process.cwd();

  // Try multiple possible .env file locations
  const possiblePaths = [
    path.resolve(projectRoot, ".env"),
    path.resolve(projectRoot, "..", ".env"),
    path.resolve(scriptDir, "..", ".env"),
    path.resolve(scriptDir, "../..", ".env"),
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const envFile = fs.readFileSync(envPath, "utf-8");
        const lines = envFile.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();

          // Skip empty lines and comments
          if (!trimmed || trimmed.startsWith("#")) {
            continue;
          }

          // Parse KEY=VALUE format
          const equalIndex = trimmed.indexOf("=");
          if (equalIndex === -1) {
            continue;
          }

          const key = trimmed.substring(0, equalIndex).trim();
          let value = trimmed.substring(equalIndex + 1).trim();

          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          // Set in process.env if not already set
          if (key && value && !process.env[key]) {
            process.env[key] = value;
          }
        }

        console.log(`✓ Loaded .env file from: ${envPath}`);
        return true;
      } catch (error) {
        console.warn(`⚠️  Failed to load .env from ${envPath}:`, error);
      }
    }
  }

  return false;
}

// Load .env file before anything else
loadEnvFile();

// Test phone number
const TEST_PHONE = "01303463436";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testFraudCheckAPI() {
  log("\n=== Fraud Check API Test ===\n", "cyan");

  // Debug: Show available env vars related to fraud check
  log("--- Environment Variables Check ---", "blue");
  const envVars = {
    ONECODESOFT_FRAUD_CHECK_API_KEY: process.env.ONECODESOFT_FRAUD_CHECK_API_KEY ? "✓ Set" : "✗ Not set",
    ONECODESOFT_DOMAIN: process.env.ONECODESOFT_DOMAIN ? `✓ ${process.env.ONECODESOFT_DOMAIN}` : "✗ Not set",
    SUPER_ADMIN_URL: process.env.SUPER_ADMIN_URL ? `✓ ${process.env.SUPER_ADMIN_URL}` : "✗ Not set",
    NEXT_PUBLIC_SUPER_ADMIN_URL: process.env.NEXT_PUBLIC_SUPER_ADMIN_URL ? `✓ ${process.env.NEXT_PUBLIC_SUPER_ADMIN_URL}` : "✗ Not set",
  };

  Object.entries(envVars).forEach(([key, value]) => {
    log(`  ${key}: ${value}`, value.startsWith("✓") ? "green" : "yellow");
  });
  log("", "reset");

  // Get API key from environment (try both possible names)
  const apiKey = process.env.ONECODESOFT_FRAUD_CHECK_API_KEY || process.env.FRAUDSHIELD_API_KEY;

  if (!apiKey) {
    log("❌ ERROR: ONECODESOFT_FRAUD_CHECK_API_KEY is not set in environment variables", "red");
    log("\nPlease ensure the API key is set in your .env file:", "yellow");
    log("  ONECODESOFT_FRAUD_CHECK_API_KEY=your-api-key", "yellow");
    log("\nOr export it before running:", "yellow");
    log("  export ONECODESOFT_FRAUD_CHECK_API_KEY='your-api-key'", "yellow");
    log("\nNote: Bun should automatically load .env files. If it's not working:", "yellow");
    log("  1. Check that .env file exists in super-admin/ directory", "yellow");
    log("  2. Verify the variable name matches exactly: ONECODESOFT_FRAUD_CHECK_API_KEY", "yellow");
    log("  3. Make sure there are no spaces around the = sign", "yellow");
    log("  4. Restart your terminal/IDE after adding to .env", "yellow");
    process.exit(1);
  }

  log(`✓ API Key found: ${apiKey.substring(0, 10)}...${apiKey.length > 10 ? " (length: " + apiKey.length + ")" : ""}`, "green");

  // Get domain from environment
  const superAdminUrl = process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || process.env.SUPER_ADMIN_URL || "";
  let domain = "";
  if (superAdminUrl) {
    try {
      const url = new URL(superAdminUrl);
      domain = url.hostname;
    } catch {
      domain = superAdminUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    }
  }
  if (!domain) {
    domain = process.env.ONECODESOFT_DOMAIN || "";
  }

  if (domain) {
    log(`✓ Domain: ${domain}`, "green");
  } else {
    log("⚠ Warning: No domain configured, using default", "yellow");
  }

  // Test phone number normalization
  log("\n--- Phone Number Normalization Test ---", "blue");
  log(`Original phone: ${TEST_PHONE}`, "reset");

  const normalizedPhone = normalizeBDPhone(TEST_PHONE);
  log(`Normalized phone: ${normalizedPhone}`, "reset");

  if (!BD_PHONE_REGEX.test(normalizedPhone)) {
    log(`❌ ERROR: Invalid phone number format: ${normalizedPhone}`, "red");
    log(`Expected format: 01[3-9]XXXXXXXX`, "yellow");
    process.exit(1);
  }

  log(`✓ Phone number is valid`, "green");

  // Create API client
  log("\n--- Creating API Client ---", "blue");
  const client = createFraudShieldClient(apiKey, domain);
  log(`✓ Client created`, "green");

  // Test checkCustomer
  log("\n--- Testing checkCustomer API ---", "blue");
  log(`Checking phone: ${normalizedPhone}`, "reset");
  log(`Making request to Onecodesoft API...`, "reset");

  try {
    const startTime = Date.now();
    const result = await client.checkCustomer(normalizedPhone);
    const duration = Date.now() - startTime;

    log(`\n✓ Request completed in ${duration}ms`, "green");

    // Log the full response
    log("\n--- API Response ---", "blue");
    console.log(JSON.stringify(result, null, 2));

    // Validate response structure
    log("\n--- Response Validation ---", "blue");

    if (result && typeof result === "object") {
      // Check for success response (new format)
      if ("status" in result && result.status === "success") {
        log("✓ Response format: New format (status: success)", "green");

        if ("courierData" in result) {
          const courierData = (result as any).courierData;
          log(`✓ Courier data present`, "green");

          if (courierData.summary) {
            const summary = courierData.summary;
            log(`\n--- Summary ---`, "cyan");
            log(`  Total Parcels: ${summary.total_parcel || 0}`, "reset");
            log(`  Successful: ${summary.success_parcel || 0}`, "reset");
            log(`  Cancelled: ${summary.cancelled_parcel || 0}`, "reset");
            log(`  Success Rate: ${summary.success_ratio || 0}%`, "reset");

            // Calculate risk level
            const successRate = summary.success_ratio || 0;
            const riskLevel = successRate >= 90 ? "LOW" : successRate >= 70 ? "MEDIUM" : "HIGH";
            const riskColor = successRate >= 90 ? "green" : successRate >= 70 ? "yellow" : "red";
            log(`  Risk Level: `, "reset");
            log(riskLevel, riskColor);
          }

          // List couriers
          const couriers = Object.entries(courierData)
            .filter(([key]) => key !== "summary")
            .map(([key, value]: [string, any]) => ({ key, ...value }));

          if (couriers.length > 0) {
            log(`\n--- Courier Details (${couriers.length}) ---`, "cyan");
            couriers.forEach((courier) => {
              log(`\n  ${courier.name || courier.key}:`, "reset");
              log(`    Total: ${courier.total_parcel || 0}`, "reset");
              log(`    Successful: ${courier.success_parcel || 0}`, "reset");
              log(`    Cancelled: ${courier.cancelled_parcel || 0}`, "reset");
              log(`    Success Rate: ${courier.success_ratio || 0}%`, "reset");
            });
          }
        } else {
          log("⚠ Warning: courierData not found in response", "yellow");
        }
      }
      // Check for error response
      else if ("success" in result && !result.success) {
        log("❌ API returned error response", "red");
        log(`  Error: ${(result as any).error || "Unknown error"}`, "red");
        log(`  Message: ${(result as any).message || "No message"}`, "red");
        log(`  Code: ${(result as any).code || "N/A"}`, "red");

        // Special handling for Imunify360 blocks
        if ((result as any).error === "Access denied" && (result as any).message?.includes("Imunify360")) {
          log("\n⚠️  Imunify360 Bot Protection Block Detected", "yellow");
          log("To fix this:", "yellow");
          log("  1. Contact Onecodesoft support to whitelist your server IP", "yellow");
          log("  2. The IP address that needs whitelisting is the IP of the server making the request", "yellow");
          log("  3. Domain whitelisting alone is not sufficient - IP whitelisting is required", "yellow");
          log("\nThe API key and configuration are correct. The issue is server-side firewall protection.", "cyan");
        }

        process.exit(1);
      }
      // Check for old format (backward compatibility)
      else if ("success" in result && result.success && "data" in result) {
        log("✓ Response format: Old format (success: true, data)", "green");
        const data = (result as any).data;
        log(`  Phone: ${data.phone || "N/A"}`, "reset");
        log(`  Total Parcels: ${data.total_parcels || 0}`, "reset");
        log(`  Success Rate: ${data.success_rate || 0}%`, "reset");
        log(`  Risk Level: ${data.fraud_risk || "N/A"}`, "reset");
      } else {
        log("⚠ Warning: Unexpected response format", "yellow");
        log(`  Response keys: ${Object.keys(result).join(", ")}`, "yellow");
      }
    } else {
      log("❌ ERROR: Invalid response type", "red");
      log(`  Type: ${typeof result}`, "red");
      process.exit(1);
    }

    log("\n=== Test Completed Successfully ===\n", "green");
  } catch (error: any) {
    log("\n❌ ERROR: Test failed", "red");
    log(`  ${error.message || "Unknown error"}`, "red");

    if (error.cause) {
      log(`  Cause: ${error.cause.message || error.cause}`, "red");
    }

    if (error.code) {
      log(`  Code: ${error.code}`, "red");
    }

    console.error("\nFull error:", error);
    process.exit(1);
  }
}

// Test via HTTP API endpoint (if server is running)
async function testHTTPEndpoint() {
  log("\n=== Testing HTTP API Endpoint ===\n", "cyan");

  const baseUrl = process.env.SUPER_ADMIN_URL || process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || "http://localhost:3001";
  const apiUrl = `${baseUrl}/api/fraud-check`;

  log(`Testing endpoint: ${apiUrl}`, "blue");
  log(`Phone number: ${TEST_PHONE}`, "reset");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: TEST_PHONE }),
    });

    log(`\nResponse Status: ${response.status} ${response.statusText}`, response.ok ? "green" : "red");

    const data = await response.json();
    log("\n--- HTTP Response ---", "blue");
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      log(`\n❌ HTTP request failed`, "red");
      log(`  Error: ${data.error || "Unknown error"}`, "red");
      log(`  Message: ${data.message || "No message"}`, "red");
      process.exit(1);
    }

    log("\n✓ HTTP endpoint test completed\n", "green");
  } catch (error: any) {
    if (error.code === "ECONNREFUSED" || error.message?.includes("ECONNREFUSED")) {
      log("\n⚠ Warning: Could not connect to HTTP endpoint", "yellow");
      log("  The server might not be running. Tested direct API call instead.", "yellow");
    } else {
      log("\n❌ ERROR: HTTP request failed", "red");
      log(`  ${error.message || "Unknown error"}`, "red");
      console.error("\nFull error:", error);
      process.exit(1);
    }
  }
}

// Main test runner
async function main() {
  const args = process.argv.slice(2);
  const testHTTP = args.includes("--http") || args.includes("-h");

  try {
    // Always test direct API call
    await testFraudCheckAPI();

    // Optionally test HTTP endpoint
    if (testHTTP) {
      await testHTTPEndpoint();
    } else {
      log("\n💡 Tip: Use --http or -h flag to also test the HTTP endpoint", "cyan");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

// Run tests
main();
