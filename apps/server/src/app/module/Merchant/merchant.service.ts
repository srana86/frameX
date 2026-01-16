import { prisma, TenantStatus } from "@framex/database";

export type ITenant = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: TenantStatus;
  customDomain?: string | null;
  deploymentUrl?: string | null;
  subscriptionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Get all tenants (was merchants)
const getAllMerchants = async () => {
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });
};

// Get tenant by ID
const getMerchantById = async (id: string) => {
  return prisma.tenant.findUnique({
    where: { id },
  });
};

// Get full tenant info with subscription, deployment, database
const getMerchantFull = async (id: string) => {
  const [tenant, subscription, deployment, database] = await Promise.all([
    prisma.tenant.findUnique({ where: { id } }),
    prisma.tenantSubscription.findFirst({ where: { tenantId: id } }),
    prisma.deployment.findFirst({ where: { tenantId: id } }),
    prisma.databaseInfo.findUnique({ where: { tenantId: id } }),
  ]);

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  let plan: Awaited<ReturnType<typeof prisma.subscriptionPlan.findUnique>> =
    null;
  if (subscription?.planId) {
    plan = await prisma.subscriptionPlan.findUnique({
      where: { id: subscription.planId },
    });
  }

  return {
    merchant: tenant, // Keep 'merchant' key for backward compatibility with frontend
    subscription,
    plan,
    deployment: deployment
      ? {
          ...deployment,
        }
      : null,
    database: database
      ? {
          ...database,
          databaseUrl: database.databaseUrl ? "***encrypted***" : undefined,
        }
      : null,
  };
};

// Create tenant (was merchant)
const createMerchant = async (payload: Partial<ITenant>) => {
  return prisma.tenant.create({
    data: {
      name: payload.name!,
      email: payload.email!,
      phone: payload.phone || null,
      status: payload.status || "ACTIVE",
      customDomain: payload.customDomain || null,
      deploymentUrl: payload.deploymentUrl || null,
      subscriptionId: payload.subscriptionId || null,
    },
  });
};

// Update tenant
const updateMerchant = async (id: string, payload: Partial<ITenant>) => {
  const { id: _, ...updateData } = payload as any;

  const tenant = await prisma.tenant.update({
    where: { id },
    data: updateData,
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  return tenant;
};

// Get tenant subscription
const getMerchantSubscription = async (id: string) => {
  const subscription = await prisma.tenantSubscription.findFirst({
    where: { tenantId: id },
    include: { plan: true },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  return subscription;
};

// Get tenant deployment
const getMerchantDeployment = async (id: string) => {
  const deployment = await prisma.deployment.findFirst({
    where: { tenantId: id },
  });

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  return deployment;
};

// Get tenant database info
const getMerchantDatabase = async (id: string) => {
  const database = await prisma.databaseInfo.findUnique({
    where: { tenantId: id },
  });

  if (!database) {
    throw new Error("Database not found");
  }

  return {
    ...database,
    databaseUrl: database.databaseUrl ? "***encrypted***" : undefined,
  };
};

// Update tenant domain
const updateMerchantDomain = async (id: string, customDomain: string) => {
  return prisma.tenant.update({
    where: { id },
    data: { customDomain },
  });
};

// Delete tenant and all associated data
const deleteMerchant = async (id: string) => {
  const tenant = await prisma.tenant.findUnique({ where: { id } });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  // Use transaction for cascade deletion
  await prisma.$transaction([
    prisma.tenantSubscription.deleteMany({ where: { tenantId: id } }),
    prisma.deployment.deleteMany({ where: { tenantId: id } }),
    prisma.databaseInfo.deleteMany({ where: { tenantId: id } }),
    prisma.tenant.delete({ where: { id } }),
  ]);

  return {
    success: true,
    message: "Tenant and all associated data deleted successfully",
  };
};

export const MerchantServices = {
  getAllMerchants,
  getMerchantById,
  getMerchantFull,
  getMerchantSubscription,
  getMerchantDeployment,
  getMerchantDatabase,
  createMerchant,
  updateMerchant,
  updateMerchantDomain,
  deleteMerchant,
};
