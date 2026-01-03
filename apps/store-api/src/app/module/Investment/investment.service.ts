/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Investment } from "./investment.model";
import { TInvestment } from "./investment.interface";
import QueryBuilder from "../../builder/QueryBuilder";

// Get all investments
const getAllInvestmentsFromDB = async (query: Record<string, unknown>) => {
  const investmentQuery = new QueryBuilder(Investment.find(), query)
    .search(["key", "category"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const investments = await investmentQuery.modelQuery;
  const meta = await investmentQuery.countTotal();

  return {
    meta,
    data: investments,
  };
};

// Create investment
const createInvestmentIntoDB = async (payload: Partial<TInvestment>) => {
  const investmentId = `INV${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

  const investment = await Investment.create({
    id: investmentId,
    key: payload.key!,
    value: payload.value!,
    category: payload.category,
    notes: payload.notes,
  });

  return investment;
};

// Update investment
const updateInvestmentIntoDB = async (
  id: string,
  payload: Partial<TInvestment>
) => {
  const investment = await Investment.findOneAndUpdate(
    { id },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!investment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Investment not found");
  }

  return investment;
};

// Delete investment
const deleteInvestmentFromDB = async (id: string) => {
  const investment = await Investment.findOneAndDelete({ id });

  if (!investment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Investment not found");
  }

  return investment;
};

export const InvestmentServices = {
  getAllInvestmentsFromDB,
  createInvestmentIntoDB,
  updateInvestmentIntoDB,
  deleteInvestmentFromDB,
};
