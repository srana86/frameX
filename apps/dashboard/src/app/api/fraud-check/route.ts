import { NextRequest, NextResponse } from "next/server";
import { createFraudShieldClient } from "@/lib/fraud-check/fraudshield-api";

// API key (hardcoded)
const ONECODESOFT_API_KEY = "08db79e3d83c68a590364a80";
// Domain for X-Domain header (required for API whitelisting)
const HARDCODED_DOMAIN = "framextech.com";

// GET /api/fraud-check - Check customer fraud data (with phone query param) or return service status
export async function GET(request: NextRequest) {
  try {
    // Check if phone is provided as query parameter
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    // If phone is provided, perform fraud check
    if (phone) {
      // Use hardcoded domain for X-Domain header (required for API whitelisting)
      const domain = HARDCODED_DOMAIN;

      console.log(`[Fraud Check API] Checking phone via GET: ${phone}, domain: ${domain}`);

      // Create API client
      const client = createFraudShieldClient(ONECODESOFT_API_KEY);

      // Check customer with domain for X-Domain header
      const result = await client.checkCustomer(phone, domain);

      if (!result.success) {
        const statusCode = result.code || 500;
        return NextResponse.json(
          {
            success: false,
            error: result.error || "Request failed",
            message: result.message || "Failed to check fraud data",
          },
          { status: statusCode }
        );
      }

      // Return the fraud check data
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    }

    // No phone provided, return service status
    return NextResponse.json({
      success: true,
      message: "Fraud Check API is available",
      service: "Onecodesoft Fraud Checker",
      usage: "Use GET /api/fraud-check?phone=01712345678 or POST /api/fraud-check with { phone: '01712345678' }",
    });
  } catch (error) {
    console.error("[Fraud Check API] Error in GET request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        message: error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}

// POST /api/fraud-check - Check customer fraud data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          message: "Phone number is required",
        },
        { status: 400 }
      );
    }

    // Use hardcoded domain for X-Domain header (required for API whitelisting)
    const domain = HARDCODED_DOMAIN;

    console.log(`[Fraud Check API] Checking phone: ${phone}, domain: ${domain}`);

    // Create API client
    const client = createFraudShieldClient(ONECODESOFT_API_KEY);

    // Check customer with domain for X-Domain header (just the domain name, e.g., "framextech.com")
    const result = await client.checkCustomer(phone, domain);

    if (!result.success) {
      const statusCode = result.code || 500;
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Request failed",
          message: result.message || "Failed to check fraud data",
        },
        { status: statusCode }
      );
    }

    // Return the fraud check data
    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("[Fraud Check API] Error in POST request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        message: error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}
