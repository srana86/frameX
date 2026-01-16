/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

// Get all users with pagination, filter, and search
// Now uses BetterAuth User model instead of legacy StoreUser
const getAllUsersFromDB = async (
  tenantId: string,
  query: Record<string, unknown>
) => {
  const builder = new PrismaQueryBuilder({
    model: prisma.user,
    query: query,
    searchFields: ["name", "email", "phone"],
  });

  const result = await builder
    .addBaseWhere({ tenantId })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();

  return result;
};

// Get single user by ID
const getSingleUserFromDB = async (tenantId: string, id: string) => {
  const result = await prisma.user.findFirst({
    where: { id, tenantId },
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return result;
};

// Get user by email
const getUserByEmailFromDB = async (tenantId: string, email: string) => {
  const result = await prisma.user.findFirst({
    where: { email, tenantId },
  });

  return result;
};

// Update user
const updateUserIntoDB = async (
  tenantId: string,
  id: string,
  payload: Partial<{
    name: string;
    email: string;
    phone: string;
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
    role: "CUSTOMER" | "MERCHANT" | "ADMIN" | "STAFF";
  }>
) => {
  const result = await prisma.user.updateMany({
    where: { id, tenantId },
    data: payload,
  });

  if (result.count === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return prisma.user.findFirst({ where: { id, tenantId } });
};

// Change user status
const changeStatus = async (
  tenantId: string,
  id: string,
  payload: { status: "ACTIVE" | "INACTIVE" | "BLOCKED" }
) => {
  const result = await prisma.user.updateMany({
    where: { id, tenantId },
    data: { status: payload.status },
  });

  if (result.count === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return prisma.user.findFirst({ where: { id, tenantId } });
};

// Change user role
const changeRole = async (
  tenantId: string,
  id: string,
  payload: { role: "CUSTOMER" | "MERCHANT" | "ADMIN" | "STAFF" }
) => {
  const result = await prisma.user.updateMany({
    where: { id, tenantId },
    data: { role: payload.role },
  });

  if (result.count === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return prisma.user.findFirst({ where: { id, tenantId } });
};

export const UserServices = {
  getAllUsersFromDB,
  getSingleUserFromDB,
  getUserByEmailFromDB,
  updateUserIntoDB,
  changeStatus,
  changeRole,
};
