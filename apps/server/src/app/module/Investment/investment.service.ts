/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder, Decimal } from "@framex/database";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";

const getAllInvestmentsFromDB = async (tenantId: string, query: Record<string, unknown>) => {
  const builder = new PrismaQueryBuilder({
    model: prisma.investment,
    query,
    searchFields: ["key", "category"]
  });

  const result = await builder
    .addBaseWhere({ tenantId })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();

  // Transform to frontend format
  const investments = result.data.map((inv: any) => ({
    id: inv.id,
    name: inv.key,
    category: inv.category || "OTHER",
    amount: Number(inv.value),
    date: inv.createdAt?.toISOString() || new Date().toISOString(),
    notes: inv.notes,
  }));

  // Calculate summary
  const totalInvested = investments.reduce((sum: number, inv: any) => sum + inv.amount, 0);

  return {
    data: investments,
    summary: {
      totalInvested,
      totalReturns: 0,
      roi: 0,
    },
    meta: result.meta,
  };
};

const createInvestmentIntoDB = async (tenantId: string, payload: any) => {
  // Map frontend field names to database columns
  // Frontend: name, amount, date, expectedReturn
  // Database: key, value, category, notes
  return prisma.investment.create({
    data: {
      tenantId,
      key: payload.name || payload.key,
      value: new Decimal(payload.amount ?? payload.value),
      category: payload.category,
      notes: payload.notes || (payload.expectedReturn ? `Expected return: ${payload.expectedReturn}` : undefined),
    }
  });
};

const updateInvestmentIntoDB = async (tenantId: string, id: string, payload: any) => {
  const investment = await prisma.investment.findFirst({ where: { tenantId, id } });
  if (!investment) throw new AppError(StatusCodes.NOT_FOUND, "Investment not found");

  const data: any = {};

  // Map frontend field names to database columns
  if (payload.name) data.key = payload.name;
  if (payload.key) data.key = payload.key;
  if (payload.amount !== undefined) data.value = new Decimal(payload.amount);
  if (payload.value !== undefined) data.value = new Decimal(payload.value);
  if (payload.category) data.category = payload.category;
  if (payload.notes) data.notes = payload.notes;

  return prisma.investment.update({
    where: { id },
    data
  });
};

const deleteInvestmentFromDB = async (tenantId: string, id: string) => {
  const investment = await prisma.investment.findFirst({ where: { tenantId, id } });
  if (!investment) throw new AppError(StatusCodes.NOT_FOUND, "Investment not found");

  await prisma.investment.delete({ where: { id } });
  return investment;
};

export const InvestmentServices = {
  getAllInvestmentsFromDB,
  createInvestmentIntoDB,
  updateInvestmentIntoDB,
  deleteInvestmentFromDB,
};
