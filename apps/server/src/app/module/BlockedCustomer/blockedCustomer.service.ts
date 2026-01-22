/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@framex/database";

const createBlockedCustomerIntoDB = async (
  tenantId: string,
  payload: any
) => {
  if (!payload.phone && !payload.email) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Phone or email is required");
  }

  // Check if already blocked in tenant
  const existing = await prisma.blockedCustomer.findFirst({
    where: {
      tenantId,
      OR: [
        { phone: payload.phone },
        { email: payload.email }
      ]
    }
  });

  if (existing) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Customer is already blocked");
  }

  const blocked = await prisma.blockedCustomer.create({
    data: {
      tenantId,
      phone: payload.phone,
      email: payload.email,
      reason: payload.reason || "Blocked by admin"
      // notes? Schema lines 844+ don't show notes. Checking schema again might be needed, but assuming standard fields.
      // Schema line 849: reason String?
      // No notes field. Will ignore payload.notes or add to reason.
    }
  });

  return blocked;
};

const getAllBlockedCustomersFromDB = async (tenantId: string) => {
  return prisma.blockedCustomer.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });
};

const checkBlockedCustomerFromDB = async (tenantId: string, phone?: string, email?: string) => {
  if (!phone && !email) return { isBlocked: false };

  const blocked = await prisma.blockedCustomer.findFirst({
    where: {
      tenantId,
      OR: [
        { phone: phone || undefined },
        { email: email || undefined }
      ]
    }
  });

  if (!blocked) return { isBlocked: false };

  return {
    isBlocked: true,
    block: {
      id: blocked.id,
      reason: blocked.reason,
    },
  };
};

const getSingleBlockedCustomerFromDB = async (tenantId: string, id: string) => {
  const blocked = await prisma.blockedCustomer.findFirst({
    where: { tenantId, id }
  });

  if (!blocked) throw new AppError(StatusCodes.NOT_FOUND, "Blocked customer not found");

  return blocked;
};

const updateBlockedCustomerIntoDB = async (
  tenantId: string,
  id: string,
  payload: any
) => {
  const existing = await prisma.blockedCustomer.findFirst({ where: { tenantId, id } });
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Blocked customer not found");

  const blocked = await prisma.blockedCustomer.update({
    where: { id },
    data: {
      phone: payload.phone,
      email: payload.email,
      reason: payload.reason
    }
  });

  return blocked;
};

const deleteBlockedCustomerFromDB = async (tenantId: string, id: string) => {
  const existing = await prisma.blockedCustomer.findFirst({ where: { tenantId, id } });
  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Blocked customer not found");

  // Hard delete since there's no isActive field in schema (lines 844-857)
  // Or did I miss it? 
  // Schema: id, tenantId, phone, email, reason, blockedAt, createdAt, updatedAt.
  // No isActive.
  await prisma.blockedCustomer.delete({ where: { id } });

  return existing;
};

export const BlockedCustomerServices = {
  createBlockedCustomerIntoDB,
  getAllBlockedCustomersFromDB,
  checkBlockedCustomerFromDB,
  getSingleBlockedCustomerFromDB,
  updateBlockedCustomerIntoDB,
  deleteBlockedCustomerFromDB,
};
