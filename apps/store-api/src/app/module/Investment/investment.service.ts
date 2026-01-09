/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder } from "@framex/database";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Decimal } from "@prisma/client/runtime/library";

const getAllInvestmentsFromDB = async (tenantId: string, query: Record<string, unknown>) => {
  const builder = new PrismaQueryBuilder({
    model: prisma.investment,
    query,
    searchFields: ["key", "category"]
  });

  return builder
    .addBaseWhere({ tenantId })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();
};

const createInvestmentIntoDB = async (tenantId: string, payload: any) => {
  return prisma.investment.create({
    data: {
      tenantId,
      key: payload.key,
      value: new Decimal(payload.value),
      category: payload.category,
      notes: payload.notes
    }
  });
};

const updateInvestmentIntoDB = async (tenantId: string, id: string, payload: any) => {
  const investment = await prisma.investment.findFirst({ where: { tenantId, id } });
  if (!investment) throw new AppError(StatusCodes.NOT_FOUND, "Investment not found");

  const data: any = { ...payload };
  if (payload.value) data.value = new Decimal(payload.value);

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
