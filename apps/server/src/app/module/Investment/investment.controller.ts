import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { InvestmentServices } from "./investment.service";

// Get all investments
const getAllInvestments = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || (req.user as any)?.tenantId || req.headers["x-tenant-id"] as string;

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID is required",
      data: null,
    });
  }

  const result = await InvestmentServices.getAllInvestmentsFromDB(tenantId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Investments retrieved successfully",
    meta: result.meta,
    data: {
      investments: result.data,
      summary: result.summary,
    },
  });
});

// Create investment
const createInvestment = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.headers["x-tenant-id"] as string;
  const result = await InvestmentServices.createInvestmentIntoDB(tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Investment created successfully",
    data: result,
  });
});

// Update investment
const updateInvestment = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.headers["x-tenant-id"] as string;
  const { id } = req.params;
  const result = await InvestmentServices.updateInvestmentIntoDB(tenantId, id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Investment updated successfully",
    data: result,
  });
});

// Delete investment
const deleteInvestment = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.headers["x-tenant-id"] as string;
  const { id } = req.params;
  await InvestmentServices.deleteInvestmentFromDB(tenantId, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Investment deleted successfully",
    data: null,
  });
});

export const InvestmentControllers = {
  getAllInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
};
