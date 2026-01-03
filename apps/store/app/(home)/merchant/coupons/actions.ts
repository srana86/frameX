"use server";

import { serverSideApiClient } from "@/lib/api-client";
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
    const client = serverSideApiClient();
    const params: Record<string, any> = { page, limit };
    if (status && status !== "all") params.status = status;
    if (search && search.trim()) params.search = search.trim();

    const response = await client.get("/coupons", { params });

    if (response.data?.data) {
      const data = response.data.data;
      const coupons = Array.isArray(data.coupons) ? data.coupons : (Array.isArray(data) ? data : []);

      // Update expired status for old coupons
      const now = new Date();
      const updatedCoupons = coupons.map((coupon: Coupon) => {
        if (coupon.status === "active" && new Date(coupon.endDate) < now) {
          return { ...coupon, status: "expired" as CouponStatus };
        }
        if (coupon.status === "scheduled" && new Date(coupon.startDate) <= now && new Date(coupon.endDate) > now) {
          return { ...coupon, status: "active" as CouponStatus };
        }
        return coupon;
      });

      // Calculate statistics
      const total = updatedCoupons.length;
      const active = updatedCoupons.filter((c: Coupon) => c.status === "active").length;
      const totalRevenue = updatedCoupons.reduce((sum: number, c: Coupon) => sum + (c.totalRevenue || 0), 0);
      const totalUsage = updatedCoupons.reduce((sum: number, c: Coupon) => sum + (c.usageLimit?.currentUses || 0), 0);

      return {
        coupons: updatedCoupons,
        pagination: data.pagination || {
          page,
          limit,
          total: coupons.length,
          totalPages: Math.ceil(coupons.length / limit),
          hasNextPage: page * limit < coupons.length,
          hasPrevPage: page > 1,
        },
        statistics: data.statistics || { total, active, totalRevenue, totalUsage },
      };
    }

    return {
      coupons: [],
      pagination: { page, limit, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
      statistics: { total: 0, active: 0, totalRevenue: 0, totalUsage: 0 },
    };
  } catch (error: any) {
    console.error("Failed to fetch coupons:", error);
    throw new Error(error?.message || "Failed to fetch coupons");
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  try {
    const client = serverSideApiClient();
    await client.delete(`/coupons/${id}`);
  } catch (error: any) {
    console.error("Failed to delete coupon:", error);
    throw new Error(error?.message || "Failed to delete coupon");
  }
}

