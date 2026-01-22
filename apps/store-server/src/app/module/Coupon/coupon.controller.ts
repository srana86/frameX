import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CouponServices } from "./coupon.service";

// Get all coupons
const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  const result = await CouponServices.getAllCouponsFromDB(tenantId as string, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Coupons retrieved successfully",
    meta: result.meta,
    data: {
      coupons: result.data,
    },
  });
});

// Get single coupon
const getSingleCoupon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user?.tenantId;
  const result = await CouponServices.getSingleCouponFromDB(tenantId as string, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Coupon retrieved successfully",
    data: result,
  });
});

// Create coupon
const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  const result = await CouponServices.createCouponIntoDB(tenantId as string, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Coupon created successfully",
    data: result,
  });
});

// Update coupon
const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user?.tenantId;
  const result = await CouponServices.updateCouponIntoDB(tenantId as string, id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Coupon updated successfully",
    data: result,
  });
});

// Delete coupon
const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user?.tenantId;
  const result = await CouponServices.deleteCouponFromDB(tenantId as string, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

// Apply coupon
const applyCoupon = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  const result = await CouponServices.applyCouponToCart(tenantId as string, req.body);

  sendResponse(res, {
    statusCode: result.success ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
    success: result.success,
    message: result.message,
    data: result,
  });
});

// Record coupon usage
const recordCouponUsage = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  const result = await CouponServices.recordCouponUsage(tenantId as string, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message || "Coupon usage recorded successfully",
    data: result.usageRecord || null,
  });
});

// Get coupon usage records
const getCouponUsageRecords = catchAsync(
  async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId;
    const result = await CouponServices.getCouponUsageRecords(tenantId as string, req.query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Coupon usage records retrieved successfully",
      meta: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPage: result.pagination.totalPage,
      },
      data: {
        records: result.records,
      },
    });
  }
);

export const CouponControllers = {
  getAllCoupons,
  getSingleCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  recordCouponUsage,
  getCouponUsageRecords,
};
