import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { InvestmentServices } from "./investment.service";

// Get all investments
const getAllInvestments = catchAsync(async (req: Request, res: Response) => {
  const result = await InvestmentServices.getAllInvestmentsFromDB(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Investments retrieved successfully",
    meta: result.meta,
    data: {
      investments: result.data,
    },
  });
});

// Create investment
const createInvestment = catchAsync(async (req: Request, res: Response) => {
  const result = await InvestmentServices.createInvestmentIntoDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Investment created successfully",
    data: result,
  });
});

// Update investment
const updateInvestment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await InvestmentServices.updateInvestmentIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Investment updated successfully",
    data: result,
  });
});

// Delete investment
const deleteInvestment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await InvestmentServices.deleteInvestmentFromDB(id);

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
