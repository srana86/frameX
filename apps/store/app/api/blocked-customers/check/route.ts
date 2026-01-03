import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import type { BlockedCustomer, BlockCheckResult } from "@/lib/blocked-customers";

// Cache blocked customer checks for 30 seconds
export const revalidate = 30;
export const dynamic = "force-dynamic";

// POST /api/blocked-customers/check - Check if a customer is blocked
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, email } = body;

    if (!phone && !email) {
      return NextResponse.json<BlockCheckResult>({
        isBlocked: false,
        message: "No identifier provided",
      });
    }

    const collection = await getCollection<BlockedCustomer>("blocked_customers");

    // Build query to check for blocked customer
    const orConditions: Record<string, unknown>[] = [];

    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, "").slice(-11);
      orConditions.push({ phone: phone }, { phone: normalizedPhone }, { phone: { $regex: normalizedPhone.slice(-10) + "$" } });
    }

    if (email) {
      orConditions.push({ email: email.toLowerCase() });
    }

    const blocked = await collection.findOne({
      $or: orConditions,
      isActive: true,
    });

    if (blocked) {
      return NextResponse.json<BlockCheckResult>(
        {
          isBlocked: true,
          customer: blocked,
          message: `This customer has been blocked due to: ${blocked.reason}`,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        }
      );
    }

    return NextResponse.json<BlockCheckResult>(
      {
        isBlocked: false,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[Blocked Customers API] Error checking block status:", error);
    return NextResponse.json<BlockCheckResult>({
      isBlocked: false,
      message: "Error checking block status",
    });
  }
}
