/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder, Decimal } from "@framex/database";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";

import {
  calculateAffiliateLevel,
  getNextLevelProgress,
} from "./affiliate.helper";

// Generate promo code helper
function generatePromoCode(userId: string, name?: string): string {
  const namePart = name
    ? name.replace(/\s+/g, "").substring(0, 3).toUpperCase()
    : "AFF";
  const idPart = userId.slice(-6).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${namePart}${idPart}${randomPart}`;
}

// Get affiliate settings (create default if not exists)
const getAffiliateSettingsFromDB = async (tenantId: string) => {
  let settings = await prisma.affiliateSettings.findUnique({
    where: { tenantId },
  });

  if (!settings) {
    settings = await prisma.affiliateSettings.create({
      data: {
        tenantId,
        enabled: false,
        minWithdrawalAmount: new Decimal(100),
        commissionLevels: {
          "1": { percentage: 5, enabled: true },
        },
        salesThresholds: {
          "1": 0,
          "2": 10,
          "3": 25,
          "4": 50,
          "5": 100,
        },
        cookieExpiryDays: 30,
      },
    });
  }

  return settings;
};

// Get current user's affiliate info
const getMyAffiliateFromDB = async (tenantId: string, userId: string) => {
  const settings = await getAffiliateSettingsFromDB(tenantId);

  if (!settings.enabled) {
    return {
      affiliate: null,
      enabled: false,
      message: "Affiliate system is not enabled",
    };
  }

  const affiliate = await prisma.affiliate.findFirst({
    where: { tenantId, userId },
  });

  if (!affiliate) {
    return {
      affiliate: null,
      enabled: true,
    };
  }

  // Calculate actual available balance from delivered orders
  // Find approved commissions
  const approvedCommissions = await prisma.affiliateCommission.findMany({
    where: {
      tenantId,
      affiliateId: affiliate.id,
      status: "APPROVED",
    },
  });

  const deliveredEarnings = approvedCommissions.reduce(
    (sum, c) => sum + Number(c.commissionAmount),
    0
  );

  const actualAvailableBalance = Math.max(
    0,
    deliveredEarnings - Number(affiliate.totalWithdrawn)
  );

  // Update if needed
  if (
    Math.abs(Number(affiliate.availableBalance) - actualAvailableBalance) > 0.01
  ) {
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        availableBalance: new Decimal(actualAvailableBalance),
        totalEarnings: new Decimal(deliveredEarnings),
      },
    });
  }

  return {
    affiliate: {
      ...affiliate,
      availableBalance: actualAvailableBalance,
      totalEarnings: deliveredEarnings,
    },
    enabled: true,
  };
};

// Create affiliate account for current user
const createMyAffiliateFromDB = async (tenantId: string, userId: string) => {
  const settings = await getAffiliateSettingsFromDB(tenantId);

  if (!settings.enabled) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Affiliate system is not enabled"
    );
  }

  const existing = await prisma.affiliate.findFirst({
    where: { tenantId, userId },
  });
  if (existing) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Affiliate account already exists"
    );
  }

  // Now using BetterAuth User model instead of StoreUser
  const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Generate unique promo code
  let promoCode = generatePromoCode(userId, user.name);
  let attempts = 0;
  while (
    await prisma.affiliate.findUnique({
      where: { tenantId_promoCode: { tenantId, promoCode } },
    })
  ) {
    promoCode = generatePromoCode(userId, user.name);
    attempts++;
    if (attempts > 10) {
      promoCode = `AFF${Date.now().toString(36).toUpperCase()}`;
      break;
    }
  }

  const affiliate = await prisma.affiliate.create({
    data: {
      tenantId,
      userId,
      promoCode,
      status: "ACTIVE",
      totalEarnings: new Decimal(0),
      totalWithdrawn: new Decimal(0),
      availableBalance: new Decimal(0),
      totalOrders: 0,
      deliveredOrders: 0,
      currentLevel: 1,
    },
  });

  return affiliate;
};

// Get all affiliates (admin)
const getAllAffiliatesFromDB = async (
  tenantId: string,
  query: Record<string, unknown>
) => {
  const builder = new PrismaQueryBuilder({
    model: prisma.affiliate,
    query,
    searchFields: ["promoCode"],
  });

  const { data: affiliates, meta } = await builder
    .addBaseWhere({ tenantId })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();

  // Enrich with user data and commission stats (using BetterAuth User model)
  const enrichedAffiliates = await Promise.all(
    affiliates.map(async (affiliate) => {
      const user = await prisma.user.findUnique({
        where: { id: affiliate.userId },
        select: { id: true, name: true, email: true, phone: true },
      });

      const totalCommissions = await prisma.affiliateCommission.count({
        where: { affiliateId: affiliate.id },
      });
      const pendingCommissions = await prisma.affiliateCommission.count({
        where: { affiliateId: affiliate.id, status: "PENDING" },
      });
      const completedCommissions = await prisma.affiliateCommission.count({
        where: { affiliateId: affiliate.id, status: "APPROVED" },
      });

      return {
        ...affiliate,
        user,
        totalCommissions,
        pendingCommissions,
        completedCommissions,
      };
    })
  );

  return { meta, data: enrichedAffiliates };
};

// Get affiliate commissions
const getCommissionsFromDB = async (
  tenantId: string,
  userId: string | null,
  affiliateId: string | null,
  query: Record<string, unknown>
) => {
  let finalAffiliateId = affiliateId;

  if (userId && !affiliateId) {
    const affiliate = await prisma.affiliate.findFirst({
      where: { tenantId, userId },
    });
    if (!affiliate) {
      return { meta: { page: 1, limit: 50, total: 0, totalPage: 0 }, data: [] };
    }
    finalAffiliateId = affiliate.id;
  }

  if (!finalAffiliateId) {
    return { meta: { page: 1, limit: 50, total: 0, totalPage: 0 }, data: [] };
  }

  const builder = new PrismaQueryBuilder({
    model: prisma.affiliateCommission,
    query,
  });

  const { data: commissions, meta } = await builder
    .addBaseWhere({ tenantId, affiliateId: finalAffiliateId })
    .sort()
    .paginate()
    .execute();

  // Enrich with order data
  const enrichedCommissions = await Promise.all(
    commissions.map(async (commission) => {
      const order = await prisma.order.findUnique({
        where: { id: commission.orderId },
        include: { customer: true },
      });

      return {
        ...commission,
        order: order
          ? {
              id: order.id,
              total: order.total,
              status: order.status,
              createdAt: order.createdAt,
              customer: order.customer,
            }
          : null,
      };
    })
  );

  return { meta, data: enrichedCommissions };
};

// Get affiliate progress
const getAffiliateProgressFromDB = async (tenantId: string, userId: string) => {
  const affiliate = await prisma.affiliate.findFirst({
    where: { tenantId, userId },
  });
  if (!affiliate) {
    throw new AppError(StatusCodes.NOT_FOUND, "Affiliate not found");
  }

  const settings = await getAffiliateSettingsFromDB(tenantId);
  const deliveredOrders = affiliate.deliveredOrders || 0;

  const settingsAny = settings as any;
  const actualLevel = calculateAffiliateLevel(deliveredOrders, settingsAny);

  const nextLevelInfo = getNextLevelProgress(
    actualLevel as any,
    deliveredOrders,
    settingsAny
  );

  return {
    currentLevel: actualLevel,
    deliveredOrders,
    nextLevel: nextLevelInfo.nextLevel,
    nextLevelRequiredSales: nextLevelInfo.requiredSales,
    progress: nextLevelInfo.progress,
    settings: {
      commissionLevels: settingsAny.commissionLevels,
      salesThresholds: settingsAny.salesThresholds,
    },
  };
};

// Get withdrawals
const getWithdrawalsFromDB = async (
  tenantId: string,
  user: any,
  affiliateId: string | null,
  status: string | null
) => {
  let finalAffiliateId = affiliateId;

  if (user.role !== "MERCHANT" && user.role !== "ADMIN" && !affiliateId) {
    const affiliate = await prisma.affiliate.findFirst({
      where: { tenantId, userId: user.id },
    });
    if (!affiliate) {
      return [];
    }
    finalAffiliateId = affiliate.id;
  }

  const where: any = { tenantId };
  if (finalAffiliateId) {
    where.affiliateId = finalAffiliateId;
  }
  if (status) {
    where.status = status;
  }

  const withdrawals = await prisma.affiliateWithdrawal.findMany({
    where,
    orderBy: { requestedAt: "desc" },
    include: { affiliate: true },
  });

  // Using BetterAuth User model
  return Promise.all(
    withdrawals.map(async (w) => {
      let user = null;
      if (w.affiliate) {
        user = await prisma.user.findUnique({
          where: { id: w.affiliate.userId },
          select: { name: true, email: true, phone: true },
        });
      }

      return {
        ...w,
        affiliate: {
          ...w.affiliate,
          user,
        },
      };
    })
  );
};

// Create withdrawal request
const createWithdrawalFromDB = async (
  tenantId: string,
  userId: string,
  payload: any
) => {
  const affiliate = await prisma.affiliate.findFirst({
    where: { tenantId, userId },
  });
  if (!affiliate) {
    throw new AppError(StatusCodes.NOT_FOUND, "Affiliate account not found");
  }

  const { amount, paymentMethod, paymentDetails } = payload;

  if (!amount || amount <= 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Amount must be greater than 0"
    );
  }

  const settings = await getAffiliateSettingsFromDB(tenantId);
  const minAmount = Number(settings.minWithdrawalAmount);

  if (amount < minAmount) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Minimum withdrawal is ${minAmount}`
    );
  }

  const availableBalance = Number(affiliate.availableBalance);

  if (amount > availableBalance) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient balance");
  }

  const pendingWithdrawalsSum = await prisma.affiliateWithdrawal.aggregate({
    where: { tenantId, affiliateId: affiliate.id, status: "PENDING" },
    _sum: { amount: true },
  });

  const pendingAmount = Number(pendingWithdrawalsSum._sum.amount || 0);

  if (pendingAmount + amount > availableBalance) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Insufficient balance (considering pending withdrawals)"
    );
  }

  // Transaction for safe deduction
  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.affiliateWithdrawal.create({
      data: {
        tenantId,
        affiliateId: affiliate.id,
        amount: new Decimal(amount),
        status: "PENDING",
        paymentMethod,
        paymentDetails,
        requestedAt: new Date(),
      },
    });

    await tx.affiliate.update({
      where: { id: affiliate.id },
      data: {
        availableBalance: { decrement: new Decimal(amount) },
      },
    });

    return withdrawal;
  });
};

// Update withdrawal status
const updateWithdrawalFromDB = async (
  tenantId: string,
  withdrawalId: string,
  newStatus: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED",
  processedBy: string,
  notes?: string
) => {
  const withdrawal = await prisma.affiliateWithdrawal.findUnique({
    where: { id: withdrawalId },
  });
  if (!withdrawal) {
    throw new AppError(StatusCodes.NOT_FOUND, "Withdrawal not found");
  }

  const updateData: any = {
    status: newStatus,
    processedBy,
    notes,
  };

  if (newStatus === "APPROVED" || newStatus === "COMPLETED") {
    updateData.processedAt = new Date();
  }

  return prisma.$transaction(async (tx) => {
    await tx.affiliateWithdrawal.update({
      where: { id: withdrawalId },
      data: updateData,
    });

    if (newStatus === "COMPLETED") {
      await tx.affiliate.update({
        where: { id: withdrawal.affiliateId },
        data: { totalWithdrawn: { increment: withdrawal.amount } },
      });
    } else if (newStatus === "REJECTED" && withdrawal.status === "PENDING") {
      // Refund balance
      await tx.affiliate.update({
        where: { id: withdrawal.affiliateId },
        data: { availableBalance: { increment: withdrawal.amount } },
      });
    }

    return { success: true };
  });
};

// Update settings
const updateAffiliateSettingsFromDB = async (
  tenantId: string,
  payload: any
) => {
  return prisma.affiliateSettings.upsert({
    where: { tenantId },
    update: payload,
    create: {
      tenantId,
      ...payload,
      id: undefined, // let prisma generate
    },
  });
};

// Assign coupon
const assignCouponToAffiliateFromDB = async (
  tenantId: string,
  affiliateId: string,
  couponId: string
) => {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
  });
  if (!affiliate || affiliate.tenantId !== tenantId) {
    throw new AppError(StatusCodes.NOT_FOUND, "Affiliate not found");
  }

  return prisma.affiliate.update({
    where: { id: affiliateId },
    data: { assignedCouponId: couponId },
  });
};

// Get affiliate by promo code
const getAffiliateByPromoCodeFromDB = async (promoCode: string) => {
  return prisma.affiliate.findFirst({
    where: {
      promoCode: promoCode.toUpperCase(),
      status: "ACTIVE",
    },
  });
};

export const AffiliateServices = {
  getAffiliateSettingsFromDB,
  getMyAffiliateFromDB,
  createMyAffiliateFromDB,
  getAllAffiliatesFromDB,
  getCommissionsFromDB,
  getAffiliateProgressFromDB,
  getWithdrawalsFromDB,
  createWithdrawalFromDB,
  updateWithdrawalFromDB,
  updateAffiliateSettingsFromDB,
  assignCouponToAffiliateFromDB,
  getAffiliateByPromoCodeFromDB,
};
