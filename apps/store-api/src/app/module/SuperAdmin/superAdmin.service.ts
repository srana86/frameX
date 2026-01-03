/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { User } from "../User/user.model";
import {
  CreateMerchantPayload,
  UpdateMerchantPayload,
  MerchantDatabase,
  MerchantDeployment,
} from "./superAdmin.interface";
import { MerchantSubscription } from "../Subscription/subscription.model";

// Get all merchants
const getAllMerchantsFromDB = async () => {
  const merchants = await User.find({
    role: "merchant",
    isDeleted: false,
  })
    .select("id fullName email status createdAt")
    .sort({ createdAt: -1 });

  return merchants.map((m) => ({
    id: m.id,
    name: m.fullName,
    email: m.email || "",
    status: m.status,
    createdAt: m.createdAt?.toISOString() || new Date().toISOString(),
  }));
};

// Create new merchant
const createMerchantFromDB = async (payload: CreateMerchantPayload) => {
  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email: payload.email }, { phone: payload.email }],
    isDeleted: false,
  });

  if (existingUser) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Merchant with this email already exists"
    );
  }

  const merchant = await User.create({
    id: `MERCH${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
    fullName: payload.name,
    email: payload.email,
    password: payload.password,
    role: "merchant",
    status: "in-progress",
    needsPasswordChange: false,
    isDeleted: false,
  });

  return {
    id: merchant.id,
    name: merchant.fullName,
    email: merchant.email || "",
    status: merchant.status || "in-progress",
    createdAt: merchant.createdAt?.toISOString() || new Date().toISOString(),
  };
};

// Update merchant
const updateMerchantFromDB = async (payload: UpdateMerchantPayload) => {
  const merchant = await User.findOne({
    id: payload.id,
    role: "merchant",
    isDeleted: false,
  });

  if (!merchant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  const updateData: any = {};
  if (payload.name) updateData.fullName = payload.name;
  if (payload.email) updateData.email = payload.email;
  if (payload.status) updateData.status = payload.status;

  const updated = await User.findOneAndUpdate({ id: payload.id }, updateData, {
    new: true,
  });

  return {
    id: updated!.id,
    name: updated!.fullName,
    email: updated!.email || "",
    status: updated!.status,
    createdAt: updated!.createdAt?.toISOString() || new Date().toISOString(),
  };
};

// Get full merchant data
const getFullMerchantDataFromDB = async (merchantId: string) => {
  const merchant = await User.findOne({
    id: merchantId,
    role: "merchant",
    isDeleted: false,
  });

  if (!merchant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  // Get subscription info

  const subscription = await MerchantSubscription.findOne({ merchantId });

  // Placeholder for database and deployment info
  // In a real multi-tenant system, these would come from separate collections
  const database: MerchantDatabase = {
    id: `db-${merchantId}`,
    databaseName: `merchant_${merchantId}`,
    useSharedDatabase: true,
    status: "active",
  };

  const deployment: MerchantDeployment = {
    id: `deploy-${merchantId}`,
    deploymentUrl: `https://${merchantId}.example.com`,
    deploymentStatus: "active",
    deploymentType: "standard",
  };

  return {
    merchant: merchant.toObject(),
    database,
    deployment,
    subscription: subscription ? subscription.toObject() : null,
  };
};

// Get merchant database information
const getMerchantDatabaseFromDB = async (merchantId: string) => {
  const merchant = await User.findOne({
    id: merchantId,
    role: "merchant",
    isDeleted: false,
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
  const merchant = await User.findOne({
    id: merchantId,
    role: "merchant",
    isDeleted: false,
  });

  if (!merchant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  const deployment: MerchantDeployment = {
    id: `deploy-${merchantId}`,
    deploymentUrl: `https://${merchantId}.example.com`,
    deploymentStatus: "active",
    deploymentType: "standard",
  };

  return { deployment };
};

// Get merchant subscription information
const getMerchantSubscriptionFromDB = async (merchantId: string) => {
  const merchant = await User.findOne({
    id: merchantId,
    role: "merchant",
    isDeleted: false,
  });

  if (!merchant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  const subscription = await MerchantSubscription.findOne({ merchantId });

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
