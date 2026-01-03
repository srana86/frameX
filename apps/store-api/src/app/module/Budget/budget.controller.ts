import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BudgetServices } from "./budget.service";

// Get all budgets
const getAllBudgets = catchAsync(async (req: Request, res: Response) => {
  const result = await BudgetServices.getAllBudgetsFromDB(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Budgets retrieved successfully",
    meta: result.meta,
    data: {
      budgets: result.data,
    },
  });
});

// Create budget
const createBudget = catchAsync(async (req: Request, res: Response) => {
  const result = await BudgetServices.createBudgetIntoDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Budget created successfully",
    data: result,
  });
});

// Update budget
const updateBudget = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BudgetServices.updateBudgetIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Budget updated successfully",
    data: result,
  });
});

// Delete budget
const deleteBudget = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await BudgetServices.deleteBudgetFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Budget deleted successfully",
    data: null,
  });
});

export const BudgetControllers = {
  getAllBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
