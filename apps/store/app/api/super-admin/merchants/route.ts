import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import type { Merchant } from "@/lib/merchant-types";
import { getAllMerchants, createMerchant, updateMerchant } from "@/lib/merchant-helpers";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * Super Admin API - Manage Merchants
 * Only super admins can access these endpoints
 */

export async function GET() {
  try {
    // Only super admin can access
    const user = await requireAuth("admin");
    
    // TODO: Add super admin check (you might want a separate "super_admin" role)
    // For now, using admin role

    const merchants = await getAllMerchants();
    return NextResponse.json(merchants);
  } catch (error: any) {
    console.error("GET /api/super-admin/merchants error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to get merchants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth("admin");
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Check if merchant with email already exists
    const existing = await getCollection<Merchant>("merchants").then(col =>
      col.findOne({ email: body.email.toLowerCase() })
    );

    if (existing) {
      return NextResponse.json({ error: "Merchant with this email already exists" }, { status: 409 });
    }

    const merchant = await createMerchant({
      name: body.name,
      email: body.email.toLowerCase(),
      phone: body.phone,
      status: body.status || "trial",
      customDomain: body.customDomain,
      deploymentUrl: body.deploymentUrl,
      subscriptionId: body.subscriptionId,
      settings: body.settings || {
        brandName: body.name,
        currency: "USD",
        timezone: "UTC",
      },
    });

    return NextResponse.json(merchant, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/super-admin/merchants error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to create merchant" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth("admin");
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Merchant ID is required" }, { status: 400 });
    }

    const updates: Partial<Merchant> = {
      name: body.name,
      email: body.email?.toLowerCase(),
      phone: body.phone,
      status: body.status,
      customDomain: body.customDomain,
      deploymentUrl: body.deploymentUrl,
      subscriptionId: body.subscriptionId,
      settings: body.settings,
    };

    // Remove undefined values
    Object.keys(updates).forEach((key) => {
      if (updates[key as keyof Merchant] === undefined) {
        delete updates[key as keyof Merchant];
      }
    });

    const updated = await updateMerchant(body.id, updates);

    if (!updated) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/super-admin/merchants error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to update merchant" }, { status: 500 });
  }
}

