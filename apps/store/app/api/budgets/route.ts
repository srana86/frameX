import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export interface Budget {
  _id?: string;
  merchantId?: string;
  name: string; // Budget name/description
  category?: string; // Optional category filter
  amount: number; // Budget amount
  period: "monthly" | "quarterly" | "yearly" | "custom"; // Budget period
  startDate: string; // Start date for the budget period
  endDate?: string; // End date (for custom periods)
  isActive: boolean; // Whether budget is currently active
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/budgets
 * Get all budgets for the current merchant
 */
export async function GET() {
  try {
    await requireAuth("merchant");

    const budgetsCol = await getMerchantCollectionForAPI<Budget>("budgets");
    const baseQuery = await buildMerchantQuery();

    const budgets = await budgetsCol
      .find(baseQuery)
      .sort({ createdAt: -1 })
      .toArray();

    // Get investments to calculate actual spending
    const investmentsCol = await getMerchantCollectionForAPI("investments");
    const investments = await investmentsCol.find(baseQuery).toArray();

    // Calculate actual spending for each budget
    const budgetsWithSpending = budgets.map((budget) => {
      const now = new Date();
      const startDate = new Date(budget.startDate);
      let endDate: Date;

      if (budget.period === "monthly") {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (budget.period === "quarterly") {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (budget.period === "yearly") {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate = budget.endDate ? new Date(budget.endDate) : new Date();
      }

      // Filter investments within budget period and category
      const relevantInvestments = investments.filter((inv: any) => {
        const invDate = new Date(inv.createdAt);
        const inPeriod = invDate >= startDate && invDate <= endDate;
        const matchesCategory = !budget.category || inv.category === budget.category;
        return inPeriod && matchesCategory;
      });

      const actualSpending = relevantInvestments.reduce((sum: number, inv: any) => sum + (inv.value || 0), 0);
      const remaining = budget.amount - actualSpending;
      const percentageUsed = budget.amount > 0 ? (actualSpending / budget.amount) * 100 : 0;
      const isOverBudget = actualSpending > budget.amount;
      const isNearLimit = percentageUsed >= 80 && percentageUsed < 100;

      return {
        ...budget,
        _id: String(budget._id),
        actualSpending,
        remaining,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        isOverBudget,
        isNearLimit,
        endDate: endDate.toISOString(),
      };
    });

    return NextResponse.json({
      budgets: budgetsWithSpending,
    });
  } catch (error: any) {
    console.error("GET /api/budgets error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to get budgets" }, { status: 500 });
  }
}

/**
 * POST /api/budgets
 * Create a new budget
 */
export async function POST(request: Request) {
  try {
    await requireAuth("merchant");

    const body = await request.json();
    const { name, category, amount, period, startDate, endDate } = body;

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
    const merchantId = await getMerchantIdForAPI();

    const now = new Date().toISOString();
    
    // Calculate end date based on period if not provided
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

    const budget: Omit<Budget, "_id"> = {
      name: name.trim(),
      category: category?.trim() || undefined,
      amount,
      period,
      startDate,
      endDate: calculatedEndDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...(merchantId && { merchantId }),
    };

    const result = await budgetsCol.insertOne(budget as any);

    return NextResponse.json({
      ...budget,
      _id: String(result.insertedId),
    });
  } catch (error: any) {
    console.error("POST /api/budgets error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to create budget" }, { status: 500 });
  }
}

