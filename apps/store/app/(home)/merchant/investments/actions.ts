"use server";

import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";

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

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type InvestmentStatistics = {
  total: number;
  count: number;
  average: number;
  byCategory: Record<string, { total: number; count: number; items: Investment[] }>;
};

type InvestmentsResponse = {
  investments: Investment[];
  pagination: PaginationData;
  statistics: InvestmentStatistics;
};

export async function getInvestments(
  page: number = 1,
  limit: number = 30,
  category?: string,
  search?: string
): Promise<InvestmentsResponse> {
  try {
    const skip = (page - 1) * limit;
    const investmentsCol = await getMerchantCollectionForAPI<Investment>("investments");
    const baseQuery = await buildMerchantQuery();

    // Build query with filters
    let query: any = { ...baseQuery };

    // Apply category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Get all investments for statistics calculation (before search filter)
    const allInvestments = await investmentsCol.find(baseQuery).sort({ createdAt: -1 }).toArray();

    // Apply search filter
    let searchQuery = { ...query };
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: "i" };
      searchQuery.$or = [{ key: searchRegex }, { category: searchRegex }, { notes: searchRegex }];
    }

    // Get total count for pagination
    const totalCount = await investmentsCol.countDocuments(searchQuery);

    // Fetch investments with pagination
    const investments = await investmentsCol.find(searchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

    // Calculate statistics from all investments (not filtered by search)
    const total = allInvestments.reduce((sum, inv) => sum + (inv.value || 0), 0);
    const count = allInvestments.length;

    // Group by category if categories exist
    const byCategory = allInvestments.reduce((acc, inv) => {
      const category = inv.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, items: [] };
      }
      acc[category].total += inv.value || 0;
      acc[category].count += 1;
      acc[category].items.push({
        ...inv,
        _id: String(inv._id),
      });
      return acc;
    }, {} as Record<string, { total: number; count: number; items: Investment[] }>);

    return {
      investments: investments.map((inv) => ({
        ...inv,
        _id: String(inv._id),
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
      statistics: {
        total,
        count,
        average: count > 0 ? total / count : 0,
        byCategory,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch investments:", error);
    throw new Error(error?.message || "Failed to fetch investments");
  }
}

export async function createInvestment(data: { key: string; value: number; category?: string; notes?: string }): Promise<Investment> {
  try {
    const { getMerchantCollectionForAPI, getMerchantIdForAPI } = await import("@/lib/api-helpers");
    const investmentsCol = await getMerchantCollectionForAPI<Investment>("investments");
    const merchantId = await getMerchantIdForAPI();

    const now = new Date().toISOString();

    const investment: Omit<Investment, "_id"> = {
      key: data.key.trim(),
      value: data.value,
      category: data.category?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      ...(merchantId && { merchantId }),
    };

    const result = await investmentsCol.insertOne(investment as any);

    return {
      ...investment,
      _id: String(result.insertedId),
    };
  } catch (error: any) {
    console.error("Failed to create investment:", error);
    throw new Error(error?.message || "Failed to create investment");
  }
}

export async function updateInvestment(
  id: string,
  data: {
    key?: string;
    value?: number;
    category?: string;
    notes?: string;
  }
): Promise<Investment> {
  try {
    const { getMerchantCollectionForAPI } = await import("@/lib/api-helpers");
    const { ObjectId } = await import("mongodb");
    const investmentsCol = await getMerchantCollectionForAPI<Investment>("investments");
    const { buildMerchantQuery } = await import("@/lib/api-helpers");
    const baseQuery = await buildMerchantQuery();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.key !== undefined) updateData.key = data.key.trim();
    if (data.value !== undefined) updateData.value = data.value;
    if (data.category !== undefined) updateData.category = data.category?.trim() || undefined;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || undefined;

    const result = await investmentsCol.findOneAndUpdate(
      { ...baseQuery, _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      throw new Error("Investment not found");
    }

    return {
      ...result,
      _id: String(result._id),
    };
  } catch (error: any) {
    console.error("Failed to update investment:", error);
    throw new Error(error?.message || "Failed to update investment");
  }
}

export async function deleteInvestment(id: string): Promise<void> {
  try {
    const { getMerchantCollectionForAPI } = await import("@/lib/api-helpers");
    const { ObjectId } = await import("mongodb");
    const investmentsCol = await getMerchantCollectionForAPI<Investment>("investments");
    const { buildMerchantQuery } = await import("@/lib/api-helpers");
    const baseQuery = await buildMerchantQuery();

    const result = await investmentsCol.deleteOne({ ...baseQuery, _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw new Error("Investment not found");
    }
  } catch (error: any) {
    console.error("Failed to delete investment:", error);
    throw new Error(error?.message || "Failed to delete investment");
  }
}

export interface Budget {
  _id?: string;
  merchantId?: string;
  name: string;
  category?: string;
  amount: number;
  period: "monthly" | "quarterly" | "yearly" | "custom";
  startDate: string;
  endDate?: string;
  isActive: boolean;
  actualSpending?: number;
  remaining?: number;
  percentageUsed?: number;
  isOverBudget?: boolean;
  isNearLimit?: boolean;
  createdAt: string;
  updatedAt: string;
}

type BudgetsResponse = {
  budgets: Budget[];
  pagination: PaginationData;
};

export async function getBudgets(
  page: number = 1,
  limit: number = 30,
  category?: string,
  search?: string,
  isActive?: boolean
): Promise<BudgetsResponse> {
  try {
    const skip = (page - 1) * limit;
    const budgetsCol = await getMerchantCollectionForAPI<Budget>("budgets");
    const investmentsCol = await getMerchantCollectionForAPI("investments");
    const baseQuery = await buildMerchantQuery();

    // Build query with filters
    let query: any = { ...baseQuery };

    // Apply category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Apply active filter
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Apply search filter
    let searchQuery = { ...query };
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: "i" };
      searchQuery.$or = [{ name: searchRegex }, { category: searchRegex }];
    }

    // Get total count for pagination
    const totalCount = await budgetsCol.countDocuments(searchQuery);

    // Fetch budgets with pagination
    const budgets = await budgetsCol.find(searchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

    // Get investments to calculate actual spending
    const investments = await investmentsCol.find(baseQuery).toArray();

    // Calculate actual spending for each budget
    const budgetsWithSpending = budgets.map((budget) => {
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

    return {
      budgets: budgetsWithSpending,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch budgets:", error);
    throw new Error(error?.message || "Failed to fetch budgets");
  }
}

export async function createBudget(data: {
  name: string;
  category?: string;
  amount: number;
  period: "monthly" | "quarterly" | "yearly" | "custom";
  startDate: string;
  endDate?: string;
  isActive?: boolean;
}): Promise<Budget> {
  try {
    const { getMerchantCollectionForAPI, getMerchantIdForAPI } = await import("@/lib/api-helpers");
    const budgetsCol = await getMerchantCollectionForAPI<Budget>("budgets");
    const merchantId = await getMerchantIdForAPI();

    const now = new Date().toISOString();

    // Calculate end date based on period if not provided
    let calculatedEndDate: string | undefined = data.endDate;
    if (!calculatedEndDate && data.period !== "custom") {
      const start = new Date(data.startDate);
      if (data.period === "monthly") {
        start.setMonth(start.getMonth() + 1);
      } else if (data.period === "quarterly") {
        start.setMonth(start.getMonth() + 3);
      } else if (data.period === "yearly") {
        start.setFullYear(start.getFullYear() + 1);
      }
      calculatedEndDate = start.toISOString();
    }

    const budget: Omit<Budget, "_id"> = {
      name: data.name.trim(),
      category: data.category?.trim() || undefined,
      amount: data.amount,
      period: data.period,
      startDate: data.startDate,
      endDate: calculatedEndDate,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      ...(merchantId && { merchantId }),
    };

    const result = await budgetsCol.insertOne(budget as any);

    return {
      ...budget,
      _id: String(result.insertedId),
    };
  } catch (error: any) {
    console.error("Failed to create budget:", error);
    throw new Error(error?.message || "Failed to create budget");
  }
}

export async function updateBudget(
  id: string,
  data: {
    name?: string;
    category?: string;
    amount?: number;
    period?: "monthly" | "quarterly" | "yearly" | "custom";
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }
): Promise<Budget> {
  try {
    const { getMerchantCollectionForAPI } = await import("@/lib/api-helpers");
    const { ObjectId } = await import("mongodb");
    const budgetsCol = await getMerchantCollectionForAPI<Budget>("budgets");
    const { buildMerchantQuery } = await import("@/lib/api-helpers");
    const baseQuery = await buildMerchantQuery();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.category !== undefined) updateData.category = data.category?.trim() || undefined;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.period !== undefined) updateData.period = data.period;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Calculate end date based on period if not provided
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate;
    } else if (data.period && data.period !== "custom" && data.startDate) {
      const start = new Date(data.startDate);
      if (data.period === "monthly") {
        start.setMonth(start.getMonth() + 1);
      } else if (data.period === "quarterly") {
        start.setMonth(start.getMonth() + 3);
      } else if (data.period === "yearly") {
        start.setFullYear(start.getFullYear() + 1);
      }
      updateData.endDate = start.toISOString();
    }

    const result = await budgetsCol.findOneAndUpdate(
      { ...baseQuery, _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      throw new Error("Budget not found");
    }

    return {
      ...result,
      _id: String(result._id),
    };
  } catch (error: any) {
    console.error("Failed to update budget:", error);
    throw new Error(error?.message || "Failed to update budget");
  }
}

export async function deleteBudget(id: string): Promise<void> {
  try {
    const { getMerchantCollectionForAPI } = await import("@/lib/api-helpers");
    const { ObjectId } = await import("mongodb");
    const budgetsCol = await getMerchantCollectionForAPI<Budget>("budgets");
    const { buildMerchantQuery } = await import("@/lib/api-helpers");
    const baseQuery = await buildMerchantQuery();

    const result = await budgetsCol.deleteOne({ ...baseQuery, _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw new Error("Budget not found");
    }
  } catch (error: any) {
    console.error("Failed to delete budget:", error);
    throw new Error(error?.message || "Failed to delete budget");
  }
}
