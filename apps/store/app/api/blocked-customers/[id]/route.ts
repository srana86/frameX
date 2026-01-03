import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import type { BlockedCustomer } from "@/lib/blocked-customers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/blocked-customers/[id] - Get specific blocked customer
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const collection = await getCollection<BlockedCustomer>("blocked_customers");

    const customer = await collection.findOne({ id });

    if (!customer) {
      return NextResponse.json({ error: "Blocked customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error: unknown) {
    console.error("[Blocked Customers API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch blocked customer" }, { status: 500 });
  }
}

// DELETE /api/blocked-customers/[id] - Unblock a customer (soft delete)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const collection = await getCollection<BlockedCustomer>("blocked_customers");

    const existing = await collection.findOne({ id });

    if (!existing) {
      return NextResponse.json({ error: "Blocked customer not found" }, { status: 404 });
    }

    // Soft delete - set isActive to false
    await collection.updateOne(
      { id },
      {
        $set: {
          isActive: false,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    console.log(`[Blocked Customers API] Unblocked customer: ${existing.phone}`);
    return NextResponse.json({ success: true, message: "Customer unblocked" });
  } catch (error: unknown) {
    console.error("[Blocked Customers API] Error unblocking customer:", error);
    return NextResponse.json({ error: "Failed to unblock customer" }, { status: 500 });
  }
}

// PUT /api/blocked-customers/[id] - Update blocked customer
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const collection = await getCollection<BlockedCustomer>("blocked_customers");

    const existing = await collection.findOne({ id });

    if (!existing) {
      return NextResponse.json({ error: "Blocked customer not found" }, { status: 404 });
    }

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Don't allow changing id or blockedAt
    delete updateData.id;
    delete updateData.blockedAt;

    await collection.updateOne({ id }, { $set: updateData });

    const updated = await collection.findOne({ id });
    return NextResponse.json({ success: true, customer: updated });
  } catch (error: unknown) {
    console.error("[Blocked Customers API] Error updating blocked customer:", error);
    return NextResponse.json({ error: "Failed to update blocked customer" }, { status: 500 });
  }
}
