import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";
import { ObjectId } from "mongodb";
import type { Investment } from "../route";

/**
 * PUT /api/investments/[id]
 * Update an investment
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth("merchant");

    const { id } = await params;
    const body = await request.json();
    const { key, value, category, notes } = body;

    if (!key || value === undefined || value === null) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    if (typeof value !== "number" || value < 0) {
      return NextResponse.json({ error: "Value must be a positive number" }, { status: 400 });
    }

    const investmentsCol = await getMerchantCollectionForAPI<Investment>("investments");
    const baseQuery = await buildMerchantQuery();

    const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!objectId) {
      return NextResponse.json({ error: "Invalid investment ID" }, { status: 400 });
    }

    const query = { ...baseQuery, _id: objectId };
    const existing = await investmentsCol.findOne(query);

    if (!existing) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 });
    }

    const update = {
      $set: {
        key: key.trim(),
        value,
        category: category?.trim() || undefined,
        notes: notes?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      },
    };

    await investmentsCol.updateOne(query, update);

    const updated = await investmentsCol.findOne(query);

    return NextResponse.json({
      ...updated,
      _id: String(updated!._id),
    });
  } catch (error: any) {
    console.error("PUT /api/investments/[id] error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to update investment" }, { status: 500 });
  }
}

/**
 * DELETE /api/investments/[id]
 * Delete an investment
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth("merchant");

    const { id } = await params;
    const investmentsCol = await getMerchantCollectionForAPI<Investment>("investments");
    const baseQuery = await buildMerchantQuery();

    const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!objectId) {
      return NextResponse.json({ error: "Invalid investment ID" }, { status: 400 });
    }

    const query = { ...baseQuery, _id: objectId };
    const result = await investmentsCol.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Investment deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/investments/[id] error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to delete investment" }, { status: 500 });
  }
}

