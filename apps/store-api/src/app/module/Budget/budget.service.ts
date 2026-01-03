/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Budget } from "./budget.model";
import { TBudget } from "./budget.interface";
import QueryBuilder from "../../builder/QueryBuilder";

// Get all budgets
const getAllBudgetsFromDB = async (query: Record<string, unknown>) => {
  const budgetQuery = new QueryBuilder(Budget.find(), query)
    .search(["name", "category"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const budgets = await budgetQuery.modelQuery;
  const meta = await budgetQuery.countTotal();

  return {
    meta,
    data: budgets,
  };
};

// Create budget
const createBudgetIntoDB = async (payload: Partial<TBudget>) => {
  const budgetId = `BGT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

  const budget = await Budget.create({
    id: budgetId,
    name: payload.name!,
    category: payload.category,
    amount: payload.amount!,
    spent: payload.spent || 0,
    period: payload.period!,
    startDate: payload.startDate,
    endDate: payload.endDate,
    isActive: payload.isActive ?? true,
    notes: payload.notes,
  });

  return budget;
};

// Update budget
const updateBudgetIntoDB = async (id: string, payload: Partial<TBudget>) => {
  const budget = await Budget.findOneAndUpdate(
    { id },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!budget) {
    throw new AppError(StatusCodes.NOT_FOUND, "Budget not found");
  }

  return budget;
};

// Delete budget
const deleteBudgetFromDB = async (id: string) => {
  const budget = await Budget.findOneAndDelete({ id });

  if (!budget) {
    throw new AppError(StatusCodes.NOT_FOUND, "Budget not found");
  }

  return budget;
};

export const BudgetServices = {
  getAllBudgetsFromDB,
  createBudgetIntoDB,
  updateBudgetIntoDB,
  deleteBudgetFromDB,
};
