"use server";

import { getCollection } from "@/lib/mongodb";
import type { Coupon, CouponStatus } from "@/lib/coupon-types";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type CouponStatistics = {
  total: number;
  active: number;
  totalRevenue: number;
  totalUsage: number;
};

type CouponsResponse = {
  coupons: Coupon[];
  pagination: PaginationData;
  statistics: CouponStatistics;
};

export async function getCoupons(page: number = 1, limit: number = 30, status?: string, search?: string): Promise<CouponsResponse> {
  try {
    const skip = (page - 1) * limit;
    const collection = await getCollection<Coupon>("coupons");

    // Build query
    const query: Record<string, unknown> = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: "i" };
      query.$or = [{ code: searchRegex }, { name: searchRegex }];
    }

    // Get all coupons for statistics (before search filter)
    const allCoupons = await collection.find({}).sort({ createdAt: -1 }).toArray();

    // Update expired status for old coupons
    const now = new Date();
    const updatedAllCoupons = allCoupons.map((coupon) => {
      if (coupon.status === "active" && new Date(coupon.endDate) < now) {
        return { ...coupon, status: "expired" as CouponStatus };
      }
      if (coupon.status === "scheduled" && new Date(coupon.startDate) <= now && new Date(coupon.endDate) > now) {
        return { ...coupon, status: "active" as CouponStatus };
      }
      return coupon;
    });

    // Get total count for pagination
    const totalCount = await collection.countDocuments(query);

    // Fetch coupons with pagination
    const coupons = await collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

    // Update expired status for paginated coupons
    const updatedCoupons = coupons.map((coupon) => {
      if (coupon.status === "active" && new Date(coupon.endDate) < now) {
        return { ...coupon, status: "expired" as CouponStatus };
      }
      if (coupon.status === "scheduled" && new Date(coupon.startDate) <= now && new Date(coupon.endDate) > now) {
        return { ...coupon, status: "active" as CouponStatus };
      }
      return coupon;
    });

    // Calculate statistics from all coupons
    const total = updatedAllCoupons.length;
    const active = updatedAllCoupons.filter((c) => c.status === "active").length;
    const totalRevenue = updatedAllCoupons.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
    const totalUsage = updatedAllCoupons.reduce((sum, c) => sum + (c.usageLimit?.currentUses || 0), 0);

    return {
      coupons: updatedCoupons,
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
        active,
        totalRevenue,
        totalUsage,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch coupons:", error);
    throw new Error(error?.message || "Failed to fetch coupons");
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  try {
    const collection = await getCollection<Coupon>("coupons");

    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      throw new Error("Coupon not found");
    }
  } catch (error: any) {
    console.error("Failed to delete coupon:", error);
    throw new Error(error?.message || "Failed to delete coupon");
  }
}
