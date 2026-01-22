import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ReviewServices } from "./review.service";

// Get product reviews
const getProductReviews = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const result = await ReviewServices.getProductReviewsFromDB(tenantId, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product reviews retrieved successfully",
    data: result,
  });
});

// Create product review
const createProductReview = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const result = await ReviewServices.createProductReviewIntoDB(tenantId, id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

export const ReviewControllers = {
  getProductReviews,
  createProductReview,
};
