import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export interface Investment {
  _id?: string;
  merchantId?: string;
  key: string; // Reason/description (why)
  value: number; // Amount (how much)
  category?: string; // Optional category
  notes?: string; // Additional notes
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/investments
 * Get all investments for the current merchant
 */
export async function GET() {
  try {
    await requireAuth("merchant");

    const investmentsCol = await getMerchantCollectionForAPI<Investment>("investments");
    const baseQuery = await buildMerchantQuery();

    const investments = await investmentsCol.find(baseQuery).sort({ createdAt: -1 }).toArray();

    // Calculate statistics
    const total = investments.reduce((sum, inv) => sum + (inv.value || 0), 0);
    const count = investments.length;

    // Group by category if categories exist
    const byCategory = investments.reduce((acc, inv) => {
      const category = inv.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, items: [] };
      }
      acc[category].total += inv.value || 0;
      acc[category].count += 1;
      acc[category].items.push(inv);
      return acc;
    }, {} as Record<string, { total: number; count: number; items: Investment[] }>);

    return NextResponse.json({
      investments: investments.map((inv) => ({
        ...inv,
        _id: String(inv._id),
      })),
      statistics: {
        total,
        count,
        average: count > 0 ? total / count : 0,
        byCategory,
      },
    });
  } catch (error: any) {
    console.error("GET /api/investments error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to get investments" }, { status: 500 });
  }
}

/**
 * POST /api/investments
 * Create a new investment
 */
export async function POST(request: Request) {
  try {
    await requireAuth("merchant");

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

    const now = new Date().toISOString();
    const merchantId = await getMerchantIdForAPI();

    const investment: Omit<Investment, "_id"> = {
      key: key.trim(),
      value,
      category: category?.trim() || undefined,
      notes: notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      ...(merchantId && { merchantId }),
    };

    const result = await investmentsCol.insertOne(investment as any);

    return NextResponse.json({
      ...investment,
      _id: String(result.insertedId),
    });
  } catch (error: any) {
    console.error("POST /api/investments error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to create investment" }, { status: 500 });
  }
}
