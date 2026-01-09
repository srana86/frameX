/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import { changeUserStatus } from "./user.utils";

const changeStatus = async (id: string, payload: { status: "ACTIVE" | "INACTIVE" | "BLOCKED" }) => {
  const result = await changeUserStatus(id, payload.status);
  return result;
};

const getAllUsers = async (tenantId?: string) => {
  return prisma.user.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { createdAt: "desc" },
  });
};

const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const UserServices = {
  changeStatus,
  getAllUsers,
  getUserById,
};