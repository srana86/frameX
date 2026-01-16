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

// Get all tenants (was merchants) - keeping function names for backward compat
const getAllMerchantsFromDB = async () => {
  const tenants = await prisma.tenant.findMany({
    where: {
      status: { not: "INACTIVE" },
    },
    orderBy: { createdAt: "desc" },
  });

  return tenants.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));
};

// Create new tenant (was merchant)
const createMerchantFromDB = async (payload: CreateMerchantPayload) => {
  // Check if tenant already exists
  const existingTenant = await prisma.tenant.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingTenant) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "Tenant with this email already exists"
    );
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: payload.name,
      email: payload.email,
      status: "ACTIVE",
    },
  });

  return {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    status: tenant.status,
    createdAt: tenant.createdAt.toISOString(),
  };
};

// Update tenant (was merchant)
const updateMerchantFromDB = async (payload: UpdateMerchantPayload) => {
  const tenant = await prisma.tenant.findUnique({
    where: {
      id: payload.id,
    },
  });

  if (!tenant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tenant not found");
  }

  const updateData: any = {};
  if (payload.name) updateData.name = payload.name;
  if (payload.email) updateData.email = payload.email;
  if (payload.status) updateData.status = payload.status;

  const updated = await prisma.tenant.update({
    where: { id: payload.id },
    data: updateData,
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
  };
};

// Get full tenant data (was merchant)
const getFullMerchantDataFromDB = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
  });

  if (!tenant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tenant not found");
  }

  // Get subscription info
  const subscription = await prisma.tenantSubscription.findFirst({
    where: { tenantId },
  });

  // Placeholder for database and deployment info
  const database: MerchantDatabase = {
    id: `db-${tenantId}`,
    databaseName: `tenant_${tenantId}`,
    useSharedDatabase: true,
    status: "active",
  };

  const deployment: MerchantDeployment = {
    id: `deploy-${tenantId}`,
    deploymentUrl: tenant.deploymentUrl || `https://${tenantId}.example.com`,
    deploymentStatus: "active",
    deploymentType: "standard",
  };

  return {
    merchant: {
      // Keep 'merchant' key for backward compat with frontend
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      status: tenant.status,
      createdAt: tenant.createdAt,
      role: "MERCHANT",
    },
    database,
    deployment,
    subscription: subscription || null,
  };
};

// Get tenant database information
const getMerchantDatabaseFromDB = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
  });

  if (!tenant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tenant not found");
  }

  const database: MerchantDatabase = {
    id: `db-${tenantId}`,
    databaseName: `tenant_${tenantId}`,
    useSharedDatabase: true,
    status: "active",
  };

  return { database };
};

// Get tenant deployment information
const getMerchantDeploymentFromDB = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
  });

  if (!tenant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tenant not found");
  }

  const deployment: MerchantDeployment = {
    id: `deploy-${tenantId}`,
    deploymentUrl: tenant.deploymentUrl || `https://${tenantId}.example.com`,
    deploymentStatus: "active",
    deploymentType: "standard",
  };

  return { deployment };
};

// Get tenant subscription information
const getMerchantSubscriptionFromDB = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
  });

  if (!tenant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tenant not found");
  }

  const subscription = await prisma.tenantSubscription.findFirst({
    where: { tenantId },
  });

  if (!subscription) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Subscription not found for this tenant"
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
