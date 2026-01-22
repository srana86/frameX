/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AffiliateServices } from "./affiliate.service";

// Get current user's affiliate info
const getMyAffiliate = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await AffiliateServices.getMyAffiliateFromDB(user.tenantId, user.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Affiliate information retrieved successfully",
    data: result,
  });
});

// Create affiliate account
const createMyAffiliate = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await AffiliateServices.createMyAffiliateFromDB(user.tenantId, user.id);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Affiliate account created successfully",
    data: result,
  });
});

// Get all affiliates (admin)
const getAllAffiliates = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await AffiliateServices.getAllAffiliatesFromDB(user.tenantId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Affiliates retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

// Get commissions
const getCommissions = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { affiliateId } = req.query;

  const userId = user.role !== "tenant" ? user.id : null;
  const finalAffiliateId =
    user.role === "tenant" && affiliateId ? String(affiliateId) : null;

  const result = await AffiliateServices.getCommissionsFromDB(
    user.tenantId,
    userId,
    finalAffiliateId,
    req.query
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Commissions retrieved successfully",
    data: {
      commissions: result.data,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    },
  });
});

// Get affiliate progress (uses current user's affiliate)
const getAffiliateProgress = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await AffiliateServices.getAffiliateProgressFromDB(user.tenantId, user.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Affiliate progress retrieved successfully",
    data: result,
  });
});

// Get withdrawals
const getWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { affiliateId, status } = req.query;

  const result = await AffiliateServices.getWithdrawalsFromDB(
    user.tenantId,
    user,
    affiliateId ? String(affiliateId) : null,
    status ? String(status) : null
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Withdrawals retrieved successfully",
    data: { withdrawals: result },
  });
});

// Create/Update withdrawal
const handleWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { action, withdrawalId, status: newStatus, notes } = req.body;

  if (action === "create" && user.role === "customer") {
    const result = await AffiliateServices.createWithdrawalFromDB(
      user.tenantId,
      user.id,
      req.body
    );

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Withdrawal request created successfully",
      data: { withdrawal: result },
    });
  } else if (action === "update" && user.role === "tenant") {
    const result = await AffiliateServices.updateWithdrawalFromDB(
      user.tenantId,
      withdrawalId,
      newStatus,
      user.id,
      notes
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Withdrawal updated successfully",
      data: result,
    });
  } else {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Invalid action",
      data: null,
    });
  }
});

// Get affiliate settings
const getSettings = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  let result = await AffiliateServices.getAffiliateSettingsFromDB(user.tenantId);

  if (!result) {
    // Return default settings
    result = {
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
        "6": 200, // added to match implicit type if any
      },
      cookieExpiryDays: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Affiliate settings retrieved successfully",
    data: {
      settings: {
        id: result.id,
        enabled: result.enabled,
        minWithdrawalAmount: result.minWithdrawalAmount,
        commissionLevels: result.commissionLevels,
        salesThresholds: (result as any).salesThresholds || {},
        cookieExpiryDays: result.cookieExpiryDays,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    },
  });
});

// Update affiliate settings
const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const {
    enabled,
    minWithdrawalAmount,
    commissionLevels,
    salesThresholds,
    cookieExpiryDays,
  } = req.body;

  const now = new Date().toISOString();
  const settingsData: Partial<any> = {
    // id: "affiliate_settings_v1", // No need to force ID here
    enabled: enabled ?? false,
    minWithdrawalAmount: minWithdrawalAmount ?? 100,
    commissionLevels: commissionLevels || {},
    salesThresholds: salesThresholds || {},
    cookieExpiryDays: cookieExpiryDays ?? 30,
    updatedAt: now,
  };

  const result =
    await AffiliateServices.updateAffiliateSettingsFromDB(user.tenantId, settingsData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Affiliate settings updated successfully",
    data: {
      settings: {
        id: result.id,
        ...settingsData,
        createdAt: result.createdAt || now,
      },
    },
  });
});

// Set affiliate cookie (public)
const setCookie = catchAsync(async (req: Request, res: Response) => {
  const { promoCode, tenantId } = req.body; // Assuming tenantId is passed or inferred

  // We need settings. If tenantId is not in body, we might be in trouble for multi-tenant.
  // But for now, let's assume we can find affiliate first, then check settings.

  if (!promoCode) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Promo code is required",
      data: null,
    });
  }

  const affiliate = await AffiliateServices.getAffiliateByPromoCodeFromDB(promoCode);

  if (!affiliate) {
    return sendResponse(res, {
      statusCode: StatusCodes.NOT_FOUND,
      success: false,
      message: "Invalid promo code",
      data: null,
    });
  }

  const settings = await AffiliateServices.getAffiliateSettingsFromDB(affiliate.tenantId);
  if (!settings.enabled) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Affiliate system is not enabled",
      data: null,
    });
  }

  // Create cookie data
  const now = Date.now();
  const expiryDays = settings.cookieExpiryDays || 30;
  const expiry = now + expiryDays * 24 * 60 * 60 * 1000;
  const cookieData = {
    promoCode: affiliate.promoCode,
    affiliateId: affiliate.id,
    timestamp: now,
    expiry,
  };

  // Set cookie (httpOnly: false to allow client-side access)
  const cookieName = "affiliate_ref";
  const cookieValue = encodeURIComponent(JSON.stringify(cookieData));
  const expiryDate = new Date(expiry);

  res.cookie(cookieName, cookieValue, {
    httpOnly: false, // Allow client-side access for display
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiryDate,
    path: "/",
    maxAge: expiryDays * 24 * 60 * 60, // Also set maxAge for better browser support
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Cookie set successfully",
    data: { success: true, promoCode: affiliate.promoCode },
  });
});

// Assign coupon to affiliate
const assignCoupon = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { affiliateId, couponId } = req.body;
  const result = await AffiliateServices.assignCouponToAffiliateFromDB(
    user.tenantId,
    affiliateId,
    couponId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Coupon assigned successfully",
    data: result,
  });
});

export const AffiliateControllers = {
  getMyAffiliate,
  createMyAffiliate,
  getAllAffiliates,
  getCommissions,
  getAffiliateProgress,
  getWithdrawals,
  handleWithdrawal,
  getSettings,
  updateSettings,
  setCookie,
  assignCoupon,
};
