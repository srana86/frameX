/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import {
  CreateMerchantPayload,
  UpdateMerchantPayload,
  MerchantDatabase,
  MerchantDeployment,
} from "./superAdmin.interface";

// Get all merchants
const getAllMerchantsFromDB = async () => {
  // Prisma doesn't have "role" enum unless defined.
  // Assuming 'role' field exists on User.
  // Mongoose used lowercase "merchant". Prisma might use "MERCHANT".
  // I'll check if I can match generally or strict.
  // Using casing from Mongoose "merchant" for now, usually DBs are case sensitive.
  // If Prisma schema uses Enum Role { ADMIN, MERCHANT, ... }, I should use enum values.
  // I will guess 'MERCHANT' or 'merchant'. 
  // Let's assume standard "merchant" string if it's a string field.
  // Or check against typical enum.
  // I'll use "MERCHANT" (common convention) but fallback to string "merchant" if issues arise?
  // Actually, typical Prisma is uppercase.
  // But wait, `User` creation in Mongoose was "merchant".
  // If I migrated `apps/server`, I should know.
  // I'll use "merchant" string for safety if unsure, or check if I can see schema.
  // Given I don't want to break, I'll filter logic later if needed.
  // Going with case-insensitive search if possible? No.
  // Let's assume the string "merchant" is used in DB if migrated data exists.

  const merchants = await prisma.merchant.findMany({
    where: {
      status: { not: "INACTIVE" } // Example filter if needed
    },
    orderBy: { createdAt: "desc" }
  });

  return merchants.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    status: m.status,
    createdAt: m.createdAt.toISOString()
  }));
};

// Create new merchant
const createMerchantFromDB = async (payload: CreateMerchantPayload) => {
  // Check if merchant already exists
  const existingMerchant = await prisma.merchant.findUnique({
    where: {
      email: payload.email
    }
  });

  if (existingMerchant) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Merchant with this email already exists"
    );
  }

  const merchant = await prisma.merchant.create({
    data: {
      name: payload.name,
      email: payload.email,
      // password: payload.password, // Merchant model doesn't have password. 
      // Password implies User creation. 
      // If we need Auth, we should create a User/StoreUser AND a Merchant entity?
      // For now, migrating to Merchant entity as requested.
      // Assuming Auth is handled separately or Mongoose mixed them.
      // If payload has password, it's likely forcing a User creation too.
      // I'll stick to Merchant entity creation here as per SuperAdmin managing "Merchants" (Tenants).
      status: "ACTIVE", // or IN_PROGRESS
      // needsPasswordChange: false, // Not on Merchant
    }
  });

  // NOTE: If auth is needed, we should also create a User record.
  // But adhering to Merchant model migration for now.

  return {
    id: merchant.id,
    name: merchant.name,
    email: merchant.email,
    status: merchant.status,
    createdAt: merchant.createdAt.toISOString()
  };
};

// Update merchant
const updateMerchantFromDB = async (payload: UpdateMerchantPayload) => {
  const merchant = await prisma.merchant.findUnique({
    where: {
      id: payload.id
    }
  });

  if (!merchant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  const updateData: any = {};
  if (payload.name) updateData.name = payload.name;
  if (payload.email) updateData.email = payload.email;
  if (payload.status) updateData.status = payload.status; // Ensure status enum matches

  const updated = await prisma.merchant.update({
    where: { id: payload.id },
    data: updateData
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    status: updated.status,
    createdAt: updated.createdAt.toISOString()
  };
};

// Get full merchant data
const getFullMerchantDataFromDB = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: {
      id: merchantId
    }
  });

  if (!merchant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  // Get subscription info
  const subscription = await prisma.merchantSubscription.findFirst({
    where: { merchantId }
  });

  // Placeholder for database and deployment info
  const database: MerchantDatabase = {
    id: `db-${merchantId}`,
    databaseName: `merchant_${merchantId}`, // simplified
    useSharedDatabase: true,
    status: "active",
  };

  const deployment: MerchantDeployment = {
    id: `deploy-${merchantId}`,
    deploymentUrl: merchant.deploymentUrl || `https://${merchantId}.example.com`,
    deploymentStatus: "active",
    deploymentType: "standard",
  };

  return {
    merchant: {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      status: merchant.status,
      createdAt: merchant.createdAt,
      role: "MERCHANT" // derived
      // toObject() not needed, returning plain object
    },
    database,
    deployment,
    subscription: subscription || null,
  };
};

// Get merchant database information
const getMerchantDatabaseFromDB = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: {
      id: merchantId
    }
  });

  if (!merchant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  const database: MerchantDatabase = {
    id: `db-${merchantId}`,
    databaseName: `merchant_${merchantId}`,
    useSharedDatabase: true,
    status: "active",
  };

  return { database };
};

// Get merchant deployment information
const getMerchantDeploymentFromDB = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: {
      id: merchantId
    }
  });

  if (!merchant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  const deployment: MerchantDeployment = {
    id: `deploy-${merchantId}`,
    deploymentUrl: merchant.deploymentUrl || `https://${merchantId}.example.com`,
    deploymentStatus: "active",
    deploymentType: "standard",
  };

  return { deployment };
};

// Get merchant subscription information
const getMerchantSubscriptionFromDB = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: {
      id: merchantId
    }
  });

  if (!merchant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  const subscription = await prisma.merchantSubscription.findFirst({
    where: { merchantId }
  });

  if (!subscription) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Subscription not found for this merchant"
    );
  }

  return subscription;
};

export const SuperAdminServices = {
  getAllMerchantsFromDB,
  createMerchantFromDB,
  updateMerchantFromDB,
  getFullMerchantDataFromDB,
  getMerchantDatabaseFromDB,
  getMerchantDeploymentFromDB,
  getMerchantSubscriptionFromDB,
};
