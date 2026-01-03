/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import {
  Affiliate,
  AffiliateSettings,
  AffiliateCommission,
  AffiliateWithdrawal,
} from "./affiliate.model";
import { User } from "../User/user.model";
import { Order } from "../Order/order.model";
import {
  TAffiliate,
  TAffiliateSettings,
  CommissionLevel,
} from "./affiliate.interface";
import QueryBuilder from "../../builder/QueryBuilder";
import {
  calculateAffiliateLevel,
  getNextLevelProgress,
} from "./affiliate.helper";

// Generate promo code helper
function generatePromoCode(userId: string, fullName?: string): string {
  const namePart = fullName
    ? fullName.replace(/\s+/g, "").substring(0, 3).toUpperCase()
    : "AFF";
  const idPart = userId.slice(-6).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${namePart}${idPart}${randomPart}`;
}

// Get affiliate settings (create default if not exists)
const getAffiliateSettingsFromDB = async () => {
  let settings = await AffiliateSettings.findOne({
    id: "affiliate_settings_v1",
  });

  if (!settings) {
    settings = await AffiliateSettings.create({
      id: "affiliate_settings_v1",
      enabled: false,
      minWithdrawalAmount: 100,
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
    });
  }

  return settings;
};

// Get current user's affiliate info
const getMyAffiliateFromDB = async (userId: string) => {
  const settings = await getAffiliateSettingsFromDB();

  if (!settings.enabled) {
    return {
      affiliate: null,
      enabled: false,
      message: "Affiliate system is not enabled",
    };
  }

  const affiliate = await Affiliate.findOne({ userId });

  if (!affiliate) {
    return {
      affiliate: null,
      enabled: true,
    };
  }

  // Calculate actual available balance from delivered orders
  const deliveredCommissions = await AffiliateCommission.find({
    affiliateId: affiliate.id,
    status: "approved",
  });

  const deliveredOrderIds = deliveredCommissions.map((c) => c.orderId);
  const deliveredOrders = await Order.find({
    id: { $in: deliveredOrderIds },
    status: "delivered",
  });

  const validOrderIds = new Set(deliveredOrders.map((o) => o.id));
  const validCommissions = deliveredCommissions.filter((c) =>
    validOrderIds.has(c.orderId)
  );

  const deliveredEarnings = validCommissions.reduce(
    (sum, c) => sum + (c.commissionAmount || 0),
    0
  );
  const actualAvailableBalance = Math.max(
    0,
    deliveredEarnings - (affiliate.totalWithdrawn || 0)
  );

  // Update if needed
  if (
    Math.abs((affiliate.availableBalance || 0) - actualAvailableBalance) > 0.01
  ) {
    await Affiliate.updateOne(
      { id: affiliate.id },
      {
        $set: {
          availableBalance: actualAvailableBalance,
          totalEarnings: deliveredEarnings,
        },
      }
    );
  }

  return {
    affiliate: {
      ...affiliate.toObject(),
      availableBalance: actualAvailableBalance,
      totalEarnings: deliveredEarnings,
    },
    enabled: true,
  };
};

// Create affiliate account for current user
const createMyAffiliateFromDB = async (userId: string) => {
  const settings = await getAffiliateSettingsFromDB();

  if (!settings.enabled) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Affiliate system is not enabled"
    );
  }

  const existing = await Affiliate.findOne({ userId });
  if (existing) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Affiliate account already exists"
    );
  }

  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Generate unique promo code
  let promoCode = generatePromoCode(userId, user.fullName);
  let attempts = 0;
  while (await Affiliate.findOne({ promoCode })) {
    promoCode = generatePromoCode(userId, user.fullName);
    attempts++;
    if (attempts > 10) {
      promoCode = `AFF${Date.now().toString(36).toUpperCase()}`;
      break;
    }
  }

  const affiliateId = `AFF${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

  const affiliate = await Affiliate.create({
    id: affiliateId,
    userId,
    promoCode,
    status: "active",
    totalEarnings: 0,
    totalWithdrawn: 0,
    availableBalance: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    currentLevel: 1,
  });

  return affiliate;
};

// Get all affiliates (admin)
const getAllAffiliatesFromDB = async (query: Record<string, unknown>) => {
  const affiliateQuery = new QueryBuilder(Affiliate.find(), query)
    .search(["promoCode"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const affiliates = await affiliateQuery.modelQuery;
  const meta = await affiliateQuery.countTotal();

  // Enrich with user data and commission stats
  const enrichedAffiliates = await Promise.all(
    affiliates.map(async (affiliate: any) => {
      const user = await User.findOne({ id: affiliate.userId }).select(
        "fullName email phone"
      );

      // Get commission stats (count, not amount)
      const totalCommissions = await AffiliateCommission.countDocuments({
        affiliateId: affiliate.id,
      });
      const pendingCommissions = await AffiliateCommission.countDocuments({
        affiliateId: affiliate.id,
        status: "pending",
      });
      const completedCommissions = await AffiliateCommission.countDocuments({
        affiliateId: affiliate.id,
        status: "approved",
      });

      return {
        ...affiliate.toObject(),
        user: user
          ? {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              phone: user.phone,
            }
          : null,
        totalCommissions,
        pendingCommissions,
        completedCommissions,
      };
    })
  );

  return {
    meta,
    data: enrichedAffiliates,
  };
};

// Get affiliate commissions (by userId for customer, or affiliateId for merchant)
const getCommissionsFromDB = async (
  userId: string | null,
  affiliateId: string | null,
  query: Record<string, unknown>
) => {
  let finalAffiliateId = affiliateId;

  // If userId provided, get affiliate by userId
  if (userId && !affiliateId) {
    const affiliate = await Affiliate.findOne({ userId });
    if (!affiliate) {
      return {
        meta: {
          page: Number(query.page) || 1,
          limit: Number(query.limit) || 50,
          total: 0,
          totalPage: 0,
        },
        data: [],
      };
    }
    finalAffiliateId = affiliate.id;
  }

  if (!finalAffiliateId) {
    return {
      meta: {
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 50,
        total: 0,
        totalPage: 0,
      },
      data: [],
    };
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 50;
  const skip = (page - 1) * limit;

  const commissions = await AffiliateCommission.find({
    affiliateId: finalAffiliateId,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AffiliateCommission.countDocuments({
    affiliateId: finalAffiliateId,
  });

  // Enrich with order data
  const enrichedCommissions = await Promise.all(
    commissions.map(async (commission: any) => {
      const order = await Order.findOne({ id: commission.orderId });
      return {
        ...commission.toObject(),
        order: order
          ? {
              id: order.id,
              total: order.total,
              status: order.status,
              createdAt: order.createdAt,
              customer: order.customer,
              courier: order.courier,
            }
          : null,
      };
    })
  );

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: enrichedCommissions,
  };
};

// Get affiliate progress/statistics (by userId)
const getAffiliateProgressFromDB = async (userId: string) => {
  const affiliate = await Affiliate.findOne({ userId });
  if (!affiliate) {
    throw new AppError(StatusCodes.NOT_FOUND, "Affiliate not found");
  }

  const settings = await getAffiliateSettingsFromDB();
  const deliveredOrders = affiliate.deliveredOrders || 0;
  const currentLevel = affiliate.currentLevel || 1;

  // Calculate actual level based on current delivered orders
  const actualLevel = calculateAffiliateLevel(deliveredOrders, settings);

  // Get next level progress
  const nextLevelInfo = getNextLevelProgress(
    actualLevel,
    deliveredOrders,
    settings
  );

  return {
    currentLevel: actualLevel,
    deliveredOrders,
    nextLevel: nextLevelInfo.nextLevel,
    nextLevelRequiredSales: nextLevelInfo.requiredSales,
    progress: nextLevelInfo.progress,
    settings: {
      commissionLevels: settings.commissionLevels,
      salesThresholds: settings.salesThresholds,
    },
  };
};

// Get withdrawals (by userId for customer, or affiliateId for merchant)
const getWithdrawalsFromDB = async (
  user: any,
  affiliateId: string | null,
  status: string | null
) => {
  let finalAffiliateId = affiliateId;

  // If user is customer, get affiliate by userId
  if (user.role !== "merchant" && !affiliateId) {
    const affiliate = await Affiliate.findOne({ userId: user.id });
    if (!affiliate) {
      return [];
    }
    finalAffiliateId = affiliate.id;
  }

  const query: any = {};
  if (finalAffiliateId) {
    query.affiliateId = finalAffiliateId;
  }
  if (status) {
    query.status = status;
  }

  const withdrawals = await AffiliateWithdrawal.find(query)
    .sort({ requestedAt: -1 })
    .lean();

  // Enrich withdrawals with affiliate and user information
  const enrichedWithdrawals = await Promise.all(
    withdrawals.map(async (w: any) => {
      let affiliateInfo = null;
      if (w.affiliateId) {
        const affiliate = await Affiliate.findOne({ id: w.affiliateId });
        if (affiliate) {
          const userInfo = await User.findOne({ id: affiliate.userId });
          affiliateInfo = {
            promoCode: affiliate.promoCode,
            user: userInfo
              ? {
                  fullName: userInfo.fullName,
                  email: userInfo.email,
                  phone: userInfo.phone,
                }
              : null,
          };
        }
      }

      return {
        ...w,
        affiliate: affiliateInfo,
      };
    })
  );

  return enrichedWithdrawals;
};

// Create withdrawal request (by userId)
const createWithdrawalFromDB = async (userId: string, payload: any) => {
  const affiliate = await Affiliate.findOne({ userId });
  if (!affiliate) {
    throw new AppError(StatusCodes.NOT_FOUND, "Affiliate account not found");
  }

  const { amount, paymentMethod, paymentDetails } = payload;

  // Validate required fields
  if (!amount || amount <= 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Amount is required and must be greater than 0"
    );
  }

  if (!paymentMethod || paymentMethod.trim() === "") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Payment method is required");
  }

  if (!paymentDetails) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Payment details are required");
  }

  // Validate payment details based on payment method
  if (
    paymentMethod.toLowerCase().includes("bank") ||
    paymentMethod.toLowerCase().includes("transfer")
  ) {
    if (
      !paymentDetails.accountNumber ||
      paymentDetails.accountNumber.trim() === ""
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Account number is required for bank transfer"
      );
    }
    if (!paymentDetails.bankName || paymentDetails.bankName.trim() === "") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Bank name is required for bank transfer"
      );
    }
    if (
      !paymentDetails.accountName ||
      paymentDetails.accountName.trim() === ""
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Account name is required for bank transfer"
      );
    }
  }

  if (
    paymentMethod.toLowerCase().includes("mobile") ||
    paymentMethod.toLowerCase().includes("bkash") ||
    paymentMethod.toLowerCase().includes("nagad") ||
    paymentMethod.toLowerCase().includes("rocket")
  ) {
    if (
      !paymentDetails.mobileNumber ||
      paymentDetails.mobileNumber.trim() === ""
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Mobile number is required for mobile banking"
      );
    }
  }

  const settings = await getAffiliateSettingsFromDB();
  const minAmount = settings.minWithdrawalAmount || 100;
  if (amount < minAmount) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Minimum withdrawal amount is ${minAmount}`
    );
  }

  // Calculate available balance from delivered orders only
  const deliveredCommissions = await AffiliateCommission.find({
    affiliateId: affiliate.id,
    status: "approved",
  });

  const deliveredOrderIds = deliveredCommissions.map((c) => c.orderId);
  const deliveredOrders = await Order.find({
    id: { $in: deliveredOrderIds },
    status: "delivered",
  });

  const validOrderIds = new Set(deliveredOrders.map((o) => o.id));
  const validCommissions = deliveredCommissions.filter((c) =>
    validOrderIds.has(c.orderId)
  );

  const deliveredEarnings = validCommissions.reduce(
    (sum, c) => sum + (c.commissionAmount || 0),
    0
  );
  const totalWithdrawn = affiliate.totalWithdrawn || 0;
  const availableBalance = deliveredEarnings - totalWithdrawn;

  // Update affiliate's availableBalance if incorrect
  if (Math.abs((affiliate.availableBalance || 0) - availableBalance) > 0.01) {
    await Affiliate.updateOne(
      { id: affiliate.id },
      { $set: { availableBalance } }
    );
  }

  if (amount > availableBalance) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Insufficient balance. Available: ${availableBalance.toFixed(2)}`
    );
  }

  // Check for pending withdrawals
  const pendingWithdrawals = await AffiliateWithdrawal.find({
    affiliateId: affiliate.id,
    status: "pending",
  });

  const totalPendingAmount = pendingWithdrawals.reduce(
    (sum, w) => sum + (w.amount || 0),
    0
  );
  if (totalPendingAmount + amount > availableBalance) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Insufficient balance. You have ${totalPendingAmount.toFixed(
        2
      )} in pending withdrawals. Available: ${(
        availableBalance - totalPendingAmount
      ).toFixed(2)}`
    );
  }

  const withdrawalId = `WD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const withdrawal = await AffiliateWithdrawal.create({
    id: withdrawalId,
    affiliateId: affiliate.id,
    amount,
    status: "pending",
    paymentMethod: paymentMethod.trim(),
    paymentDetails: {
      accountName: paymentDetails.accountName?.trim(),
      accountNumber: paymentDetails.accountNumber?.trim(),
      bankName: paymentDetails.bankName?.trim(),
      mobileNumber: paymentDetails.mobileNumber?.trim(),
    },
    requestedAt: now,
  });

  // Deduct amount from available balance immediately (reserve it)
  await Affiliate.updateOne(
    { id: affiliate.id },
    {
      $inc: { availableBalance: -amount },
      $set: { updatedAt: now },
    }
  );

  return withdrawal;
};

// Update withdrawal status (merchant)
const updateWithdrawalFromDB = async (
  withdrawalId: string,
  newStatus: string,
  processedBy: string,
  notes?: string
) => {
  const withdrawal = await AffiliateWithdrawal.findOne({ id: withdrawalId });
  if (!withdrawal) {
    throw new AppError(StatusCodes.NOT_FOUND, "Withdrawal not found");
  }

  const updateData: any = {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  if (newStatus === "approved" || newStatus === "completed") {
    updateData.processedAt = new Date().toISOString();
    updateData.processedBy = processedBy;

    // If completed, update totalWithdrawn (balance already deducted when created)
    if (newStatus === "completed") {
      const affiliate = await Affiliate.findOne({ id: withdrawal.affiliateId });
      if (affiliate) {
        await Affiliate.updateOne(
          { id: affiliate.id },
          {
            $inc: { totalWithdrawn: withdrawal.amount },
            $set: { updatedAt: new Date().toISOString() },
          }
        );
      }
    }
  } else if (newStatus === "rejected") {
    // If rejected, return the amount to available balance
    const affiliate = await Affiliate.findOne({ id: withdrawal.affiliateId });
    if (affiliate && withdrawal.status === "pending") {
      await Affiliate.updateOne(
        { id: affiliate.id },
        {
          $inc: { availableBalance: withdrawal.amount },
          $set: { updatedAt: new Date().toISOString() },
        }
      );
    }
  }

  if (notes) {
    updateData.notes = notes;
  }

  await AffiliateWithdrawal.updateOne(
    { id: withdrawalId },
    { $set: updateData }
  );

  return { success: true };
};

// Update affiliate settings (admin)
const updateAffiliateSettingsFromDB = async (
  payload: Partial<TAffiliateSettings>
) => {
  const settings = await AffiliateSettings.findOneAndUpdate(
    { id: "affiliate_settings_v1" },
    { ...payload, id: "affiliate_settings_v1" },
    { upsert: true, new: true }
  );

  return settings;
};

// Assign coupon to affiliate
const assignCouponToAffiliateFromDB = async (
  affiliateId: string,
  couponId: string
) => {
  const affiliate = await Affiliate.findOne({ id: affiliateId });
  if (!affiliate) {
    throw new AppError(StatusCodes.NOT_FOUND, "Affiliate not found");
  }

  const updated = await Affiliate.findOneAndUpdate(
    { id: affiliateId },
    { $set: { assignedCouponId: couponId } },
    { new: true }
  );

  return updated;
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
};
