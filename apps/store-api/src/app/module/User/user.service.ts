/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

// Get all users with pagination, filter, and search
const getAllUsersFromDB = async (
  tenantId: string,
  query: Record<string, unknown>
) => {
  const builder = new PrismaQueryBuilder({
    model: prisma.storeUser,
    query: query,
    searchFields: ["fullName", "email", "phone"],
  });

  const result = await builder
    .addBaseWhere({ tenantId, isDeleted: false })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();

  return result;
};

// Get single user by ID
const getSingleUserFromDB = async (tenantId: string, id: string) => {
  const result = await prisma.storeUser.findFirst({
    where: { id, tenantId, isDeleted: false },
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return result;
};

// Create user
const createUserIntoDB = async (
  tenantId: string,
  payload: {
    fullName: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: "CUSTOMER" | "MERCHANT" | "ADMIN";
  }
) => {
  const result = await prisma.storeUser.create({
    data: {
      tenantId,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      role: payload.role || "CUSTOMER",
    },
  });
  return result;
};

// Update user
const updateUserIntoDB = async (
  tenantId: string,
  id: string,
  payload: Partial<{
    fullName: string;
    email: string;
    phone: string;
    status: "IN_PROGRESS" | "BLOCKED";
  }>
) => {
  const result = await prisma.storeUser.updateMany({
    where: { id, tenantId, isDeleted: false },
    data: payload,
  });

  if (result.count === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return prisma.storeUser.findFirst({ where: { id, tenantId } });
};

// Delete user (soft delete)
const deleteUserFromDB = async (tenantId: string, id: string) => {
  const result = await prisma.storeUser.updateMany({
    where: { id, tenantId, isDeleted: false },
    data: { isDeleted: true },
  });

  if (result.count === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return result;
};

// Change user status
const changeStatus = async (
  tenantId: string,
  id: string,
  payload: { status: "IN_PROGRESS" | "BLOCKED" }
) => {
  const result = await prisma.storeUser.updateMany({
    where: { id, tenantId, isDeleted: false },
    data: { status: payload.status },
  });

  if (result.count === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return prisma.storeUser.findFirst({ where: { id, tenantId } });
};

export const UserServices = {
  getAllUsersFromDB,
  getSingleUserFromDB,
  createUserIntoDB,
  updateUserIntoDB,
  deleteUserFromDB,
  changeStatus,
};
