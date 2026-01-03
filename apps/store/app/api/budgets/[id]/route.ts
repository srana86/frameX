import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";
import { ObjectId } from "mongodb";
import type { Budget } from "../route";

/**
 * PUT /api/budgets/[id]
 * Update a budget
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth("merchant");

    const { id } = await params;
    const body = await request.json();
    const { name, category, amount, period, startDate, endDate, isActive } = body;

    if (!name || amount === undefined || amount === null || !period || !startDate) {
      return NextResponse.json(
        { error: "Name, amount, period, and startDate are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const budgetsCol = await getMerchantCollectionForAPI<Budget>("budgets");
    const baseQuery = await buildMerchantQuery();

    const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!objectId) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const query = { ...baseQuery, _id: objectId };
    const existing = await budgetsCol.findOne(query);

    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // Calculate end date if not provided
    let calculatedEndDate: string | undefined = endDate;
    if (!calculatedEndDate && period !== "custom") {
      const start = new Date(startDate);
      if (period === "monthly") {
        start.setMonth(start.getMonth() + 1);
      } else if (period === "quarterly") {
        start.setMonth(start.getMonth() + 3);
      } else if (period === "yearly") {
        start.setFullYear(start.getFullYear() + 1);
      }
      calculatedEndDate = start.toISOString();
    }

    const update = {
      $set: {
        name: name.trim(),
        category: category?.trim() || undefined,
        amount,
        period,
        startDate,
        endDate: calculatedEndDate,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        updatedAt: new Date().toISOString(),
      },
    };

    await budgetsCol.updateOne(query, update);

    const updated = await budgetsCol.findOne(query);

    return NextResponse.json({
      ...updated,
      _id: String(updated!._id),
    });
  } catch (error: any) {
    console.error("PUT /api/budgets/[id] error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to update budget" }, { status: 500 });
  }
}

/**
 * DELETE /api/budgets/[id]
 * Delete a budget
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth("merchant");

    const { id } = await params;
    const budgetsCol = await getMerchantCollectionForAPI<Budget>("budgets");
    const baseQuery = await buildMerchantQuery();

    const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!objectId) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const query = { ...baseQuery, _id: objectId };
    const result = await budgetsCol.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Budget deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/budgets/[id] error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to delete budget" }, { status: 500 });
  }
}

