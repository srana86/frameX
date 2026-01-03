/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { BlockedCustomer } from "./blockedCustomer.model";
import { TBlockedCustomer } from "./blockedCustomer.interface";
import QueryBuilder from "../../builder/QueryBuilder";

const createBlockedCustomerIntoDB = async (
  payload: Partial<TBlockedCustomer>
) => {
  if (!payload.phone && !payload.email) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Phone or email is required");
  }

  // Check if already blocked
  const existingQuery: any = {};
  if (payload.phone) existingQuery.phone = payload.phone;
  if (payload.email) existingQuery.email = payload.email;

  const existing = await BlockedCustomer.findOne({
    ...existingQuery,
    isActive: true,
  });

  if (existing) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Customer is already blocked");
  }

  const blockedId = `BLK${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

  const blocked = await BlockedCustomer.create({
    id: blockedId,
    phone: payload.phone,
    email: payload.email,
    reason: payload.reason || "Blocked by admin",
    notes: payload.notes,
    isActive: true,
    blockedAt: new Date().toISOString(),
  });

  return blocked;
};

const getAllBlockedCustomersFromDB = async () => {
  const blocked = await BlockedCustomer.find({ isActive: true }).sort({
    createdAt: -1,
  });

  return blocked;
};

const checkBlockedCustomerFromDB = async (phone?: string, email?: string) => {
  if (!phone && !email) {
    return { isBlocked: false };
  }

  const query: any = { isActive: true };
  if (phone) query.phone = phone;
  if (email) query.email = email;

  const blocked = await BlockedCustomer.findOne(query);

  if (!blocked) {
    return { isBlocked: false };
  }

  return {
    isBlocked: true,
    block: {
      id: blocked.id,
      reason: blocked.reason,
    },
  };
};

const getSingleBlockedCustomerFromDB = async (id: string) => {
  const blocked = await BlockedCustomer.findOne({ id });

  if (!blocked) {
    throw new AppError(StatusCodes.NOT_FOUND, "Blocked customer not found");
  }

  return blocked;
};

const updateBlockedCustomerIntoDB = async (
  id: string,
  payload: Partial<TBlockedCustomer>
) => {
  const blocked = await BlockedCustomer.findOneAndUpdate(
    { id },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!blocked) {
    throw new AppError(StatusCodes.NOT_FOUND, "Blocked customer not found");
  }

  return blocked;
};

const deleteBlockedCustomerFromDB = async (id: string) => {
  const blocked = await BlockedCustomer.findOneAndUpdate(
    { id },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!blocked) {
    throw new AppError(StatusCodes.NOT_FOUND, "Blocked customer not found");
  }

  return blocked;
};

export const BlockedCustomerServices = {
  createBlockedCustomerIntoDB,
  getAllBlockedCustomersFromDB,
  checkBlockedCustomerFromDB,
  getSingleBlockedCustomerFromDB,
  updateBlockedCustomerIntoDB,
  deleteBlockedCustomerFromDB,
};
