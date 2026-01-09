import { prisma, TenantStatus } from "@framex/database";

export type IMerchant = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: TenantStatus;
  customDomain?: string | null;
  deploymentUrl?: string | null;
  subscriptionId?: string | null;
  settings?: {
    brandName?: string;
    logo?: string;
    theme?: { primaryColor?: string };
    currency?: string;
    timezone?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

const getAllMerchants = async () => {
  return prisma.merchant.findMany({
    orderBy: { createdAt: "desc" },
  });
};

const getMerchantById = async (id: string) => {
  return prisma.merchant.findUnique({
    where: { id },
  });
};

const getMerchantFull = async (id: string) => {
  const [merchant, subscription, deployment, database] = await Promise.all([
    prisma.merchant.findUnique({ where: { id } }),
    prisma.merchantSubscription.findFirst({ where: { merchantId: id } }),
    prisma.deployment.findFirst({ where: { merchantId: id } }),
    prisma.databaseInfo.findUnique({ where: { merchantId: id } }),
  ]);

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  let plan = null;
  if (subscription?.planId) {
    plan = await prisma.subscriptionPlan.findUnique({
      where: { id: subscription.planId },
    });
  }

  return {
    merchant,
    subscription,
    plan,
    deployment: deployment
      ? {
        ...deployment,
        // Mask sensitive data
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

const createMerchant = async (payload: Partial<IMerchant>) => {
  return prisma.merchant.create({
    data: {
      name: payload.name!,
      email: payload.email!,
      phone: payload.phone || null,
      status: payload.status || "ACTIVE",
      customDomain: payload.customDomain || null,
      deploymentUrl: payload.deploymentUrl || null,
      subscriptionId: payload.subscriptionId || null,
      settings: payload.settings || {
        brandName: payload.name,
        currency: "USD",
        timezone: "UTC",
      },
    },
  });
};

const updateMerchant = async (id: string, payload: Partial<IMerchant>) => {
  const { id: _, ...updateData } = payload as any;

  const merchant = await prisma.merchant.update({
    where: { id },
    data: updateData,
  });

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  return merchant;
};

const getMerchantSubscription = async (id: string) => {
  const subscription = await prisma.merchantSubscription.findFirst({
    where: { merchantId: id },
    include: { plan: true },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  return subscription;
};

const getMerchantDeployment = async (id: string) => {
  const deployment = await prisma.deployment.findFirst({
    where: { merchantId: id },
  });

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  return deployment;
};

const getMerchantDatabase = async (id: string) => {
  const database = await prisma.databaseInfo.findUnique({
    where: { merchantId: id },
  });

  if (!database) {
    throw new Error("Database not found");
  }

  return {
    ...database,
    databaseUrl: database.databaseUrl ? "***encrypted***" : undefined,
  };
};

const updateMerchantDomain = async (id: string, customDomain: string) => {
  return prisma.merchant.update({
    where: { id },
    data: { customDomain },
  });
};

const deleteMerchant = async (id: string) => {
  const merchant = await prisma.merchant.findUnique({ where: { id } });

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  // Use transaction for cascade deletion
  await prisma.$transaction([
    prisma.merchantSubscription.deleteMany({ where: { merchantId: id } }),
    prisma.deployment.deleteMany({ where: { merchantId: id } }),
    prisma.databaseInfo.deleteMany({ where: { merchantId: id } }),
    prisma.merchant.delete({ where: { id } }),
  ]);

  return {
    success: true,
    message: "Merchant and all associated data deleted successfully",
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
