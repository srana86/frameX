import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import type { BlockedCustomer } from "@/lib/blocked-customers";

// Cache blocked customers for 60 seconds
export const revalidate = 60;
export const dynamic = "force-dynamic";

// GET /api/blocked-customers - List all blocked customers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const collection = await getCollection<BlockedCustomer>("blocked_customers");

    // If phone is provided, check if this specific phone is blocked
    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, "").slice(-11); // Last 11 digits
      const blocked = await collection.findOne({
        $or: [{ phone: phone }, { phone: normalizedPhone }, { phone: { $regex: normalizedPhone.slice(-10) + "$" } }],
        ...(activeOnly && { isActive: true }),
      });

      return NextResponse.json(
        {
          isBlocked: !!blocked,
          customer: blocked || null,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        }
      );
    }

    // List all blocked customers
    const query = activeOnly ? { isActive: true } : {};
    const blockedCustomers = await collection.find(query).sort({ blockedAt: -1 }).toArray();

    return NextResponse.json(
      {
        customers: blockedCustomers,
        total: blockedCustomers.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[Blocked Customers API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch blocked customers" }, { status: 500 });
  }
}

// POST /api/blocked-customers - Block a customer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, email, customerName, reason, notes, orderId, orderIds } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const collection = await getCollection<BlockedCustomer>("blocked_customers");

    // Normalize phone number (keep last 11 digits for consistency)
    const normalizedPhone = phone.replace(/\D/g, "").slice(-11);

    // Check if already blocked
    const existing = await collection.findOne({
      $or: [{ phone: phone }, { phone: normalizedPhone }, { phone: { $regex: normalizedPhone.slice(-10) + "$" } }],
    });

    if (existing && existing.isActive) {
      return NextResponse.json({ error: "Customer is already blocked", customer: existing }, { status: 400 });
    }

    const now = new Date().toISOString();
    const blockedCustomer: BlockedCustomer = {
      id: `blocked_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone: normalizedPhone,
      email: email || undefined,
      customerName: customerName || undefined,
      reason: reason || "fraud",
      notes: notes || undefined,
      blockedAt: now,
      orderId: orderId || undefined,
      orderIds: orderIds || (orderId ? [orderId] : []),
      isActive: true,
    };

    // If existing but inactive, reactivate
    if (existing && !existing.isActive) {
      await collection.updateOne(
        { id: existing.id },
        {
          $set: {
            isActive: true,
            reason: reason || existing.reason,
            notes: notes || existing.notes,
            updatedAt: now,
            ...(orderId && { orderId }),
            ...(orderIds && { orderIds }),
          },
        }
      );
      const updated = await collection.findOne({ id: existing.id });
      return NextResponse.json({ success: true, customer: updated, message: "Customer re-blocked" });
    }

    await collection.insertOne(blockedCustomer);

    console.log(`[Blocked Customers API] Blocked customer: ${normalizedPhone}`);
    return NextResponse.json({ success: true, customer: blockedCustomer });
  } catch (error: unknown) {
    console.error("[Blocked Customers API] Error blocking customer:", error);
    return NextResponse.json({ error: "Failed to block customer" }, { status: 500 });
  }
}
