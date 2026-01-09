/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder } from "@framex/database";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Decimal } from "@prisma/client/runtime/library";

const getAllBudgetsFromDB = async (tenantId: string, query: Record<string, unknown>) => {
  const builder = new PrismaQueryBuilder({
    model: prisma.budget,
    query,
    searchFields: ["name", "category"]
  });

  return builder
    .addBaseWhere({ tenantId })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();
};

const createBudgetIntoDB = async (tenantId: string, payload: any) => {
  return prisma.budget.create({
    data: {
      tenantId,
      name: payload.name,
      category: payload.category,
      amount: new Decimal(payload.amount),
      spent: new Decimal(payload.spent || 0),
      period: payload.period,
      startDate: payload.startDate,
      endDate: payload.endDate,
      isActive: payload.isActive ?? true,
      notes: payload.notes
    }
  });
};

const updateBudgetIntoDB = async (tenantId: string, id: string, payload: any) => {
  const budget = await prisma.budget.findFirst({ where: { tenantId, id } });
  if (!budget) throw new AppError(StatusCodes.NOT_FOUND, "Budget not found");

  const data: any = { ...payload };
  if (payload.amount) data.amount = new Decimal(payload.amount);
  if (payload.spent) data.spent = new Decimal(payload.spent);

  return prisma.budget.update({
    where: { id },
    data
  });
};

const deleteBudgetFromDB = async (tenantId: string, id: string) => {
  const budget = await prisma.budget.findFirst({ where: { tenantId, id } });
  if (!budget) throw new AppError(StatusCodes.NOT_FOUND, "Budget not found");

  await prisma.budget.delete({ where: { id } });
  return budget;
};

export const BudgetServices = {
  getAllBudgetsFromDB,
  createBudgetIntoDB,
  updateBudgetIntoDB,
  deleteBudgetFromDB,
};
