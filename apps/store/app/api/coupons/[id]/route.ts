import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import type { Coupon, CouponStatus } from "@/lib/coupon-types";
import { validateCouponCode } from "@/lib/coupon-types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/coupons/[id] - Get a specific coupon
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const collection = await getCollection<Coupon>("coupons");

    const coupon = await collection.findOne({
      $or: [{ id }, { code: id.toUpperCase() }],
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Update status if needed
    const now = new Date();
    let updatedStatus = coupon.status;
    if (coupon.status === "active" && new Date(coupon.endDate) < now) {
      updatedStatus = "expired";
    } else if (coupon.status === "scheduled" && new Date(coupon.startDate) <= now && new Date(coupon.endDate) > now) {
      updatedStatus = "active";
    }

    return NextResponse.json({ ...coupon, status: updatedStatus });
  } catch (error: unknown) {
    console.error("[Coupons API] Error fetching coupon:", error);
    return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 });
  }
}

// PUT /api/coupons/[id] - Update a coupon
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const collection = await getCollection<Coupon>("coupons");

    // Find existing coupon
    const existing = await collection.findOne({ id });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // If code is being changed, validate it
    if (body.code && body.code.toUpperCase() !== existing.code) {
      const normalizedCode = body.code.toUpperCase().trim();
      if (!validateCouponCode(normalizedCode)) {
        return NextResponse.json({ error: "Invalid coupon code format" }, { status: 400 });
      }

      // Check for duplicate
      const duplicate = await collection.findOne({
        code: normalizedCode,
        id: { $ne: id },
      });
      if (duplicate) {
        return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 400 });
      }
      body.code = normalizedCode;
    }

    // Validate discount value if provided
    if (body.discountValue !== undefined) {
      const type = body.type || existing.type;
      if (type === "percentage" && (body.discountValue < 0 || body.discountValue > 100)) {
        return NextResponse.json({ error: "Percentage discount must be between 0 and 100" }, { status: 400 });
      }
    }

    // Update status based on dates if changed
    let newStatus = body.status || existing.status;
    const startDate = new Date(body.startDate || existing.startDate);
    const endDate = new Date(body.endDate || existing.endDate);
    const now = new Date();

    if (body.status !== "inactive") {
      if (endDate < now) {
        newStatus = "expired";
      } else if (startDate > now) {
        newStatus = "scheduled";
      } else if (newStatus === "scheduled" || newStatus === "expired") {
        newStatus = "active";
      }
    }

    const updateData: Partial<Coupon> = {
      ...body,
      status: newStatus,
      updatedAt: now.toISOString(),
    };

    // Remove fields that shouldn't be updated
    delete (updateData as Record<string, unknown>).id;
    delete (updateData as Record<string, unknown>).createdAt;

    // Preserve currentUses from existing coupon if usageLimit is being updated
    if (updateData.usageLimit && existing.usageLimit) {
      updateData.usageLimit.currentUses = existing.usageLimit.currentUses;
    }

    await collection.updateOne({ id }, { $set: updateData });

    const updated = await collection.findOne({ id });
    console.log(`[Coupons API] Updated coupon: ${id}`);

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("[Coupons API] Error updating coupon:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

// DELETE /api/coupons/[id] - Delete a coupon
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const collection = await getCollection<Coupon>("coupons");

    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    console.log(`[Coupons API] Deleted coupon: ${id}`);
    return NextResponse.json({ success: true, message: "Coupon deleted" });
  } catch (error: unknown) {
    console.error("[Coupons API] Error deleting coupon:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
