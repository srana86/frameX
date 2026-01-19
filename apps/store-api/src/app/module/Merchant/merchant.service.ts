/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { SuperAdminServices } from "../SuperAdmin/superAdmin.service";
import { ConfigServices } from "../Config/config.service";
import { SubscriptionServices } from "../Subscription/subscription.service";
import {
  MerchantContext,
  FraudCheckData,
  DomainConfig,
  FeatureCheck,
} from "./merchant.interface";

// Get merchant context
const getMerchantContextFromDB = async (merchantId?: string) => {
  if (!merchantId) throw new AppError(StatusCodes.BAD_REQUEST, "Merchant ID required");

  // Retrieve merchant from User table (as merchants are Users in the platform)
  const userMerchant = await prisma.user.findFirst({
    where: { id: merchantId } // merchantId is guaranteed to be string here due to check above
  });

  if (!userMerchant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  // Use tenantId to get full merchant data (which is actually tenant data)
  if (!userMerchant.tenantId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Merchant has no associated tenant");
  }

  const fullData = await SuperAdminServices.getFullMerchantDataFromDB(
    userMerchant.tenantId
  );

  const context: MerchantContext = {
    merchant: {
      id: userMerchant.id,
      name: userMerchant.name || "",
      email: userMerchant.email,
      status: (userMerchant.status || "ACTIVE") as any, // Cast to any or specific enum if known
      settings: {},
    },
    database: fullData.database
      ? {
        id: fullData.database.id,
        databaseName: fullData.database.databaseName,
        useSharedDatabase: fullData.database.useSharedDatabase,
        status: fullData.database.status,
      }
      : null,
    deployment: fullData.deployment
      ? {
        id: fullData.deployment.id,
        deploymentUrl: fullData.deployment.deploymentUrl,
        deploymentStatus: fullData.deployment.deploymentStatus,
        deploymentType: fullData.deployment.deploymentType,
      }
      : null,
    dbName: fullData.database?.databaseName || "",
    hasConnectionString: false,
  };

  return context;
};

// Get merchant data from brand config
const getMerchantDataFromBrandConfig = async (merchantId: string) => {
  const brandConfig = await ConfigServices.getBrandConfigFromDB(merchantId);
  return {
    merchant: {
      name: brandConfig.name,
      logo: brandConfig.logo,
      // Add other brand config fields as needed
    },
  };
};

// Get merchant plan subscription
const getMerchantPlanSubscriptionFromDB = async (merchantId: string) => {
  const subscription =
    await SubscriptionServices.getCurrentMerchantSubscriptionFromDB(merchantId);
  return subscription;
};

// Check features
const checkFeaturesFromDB = async (merchantId: string, features: string[]) => {
  const subscription =
    await SubscriptionServices.getCurrentMerchantSubscriptionFromDB(merchantId);

  // Get plan features if subscription exists
  let planFeatures: any = {};
  if (subscription?.planId) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: subscription.planId }
    });
    planFeatures = plan?.features || {};
  }

  const result: Record<string, FeatureCheck> = {};

  for (const feature of features) {
    const featureConfig = planFeatures?.[feature];
    result[feature] = {
      enabled: featureConfig?.enabled ?? false,
      limit: featureConfig?.limit ?? "unlimited",
      currentUsage: 0, // TODO: Calculate actual usage
    };
  }

  return { features: result };
};

// Get feature limits
const getFeatureLimitsFromDB = async (merchantId: string) => {
  const subscription =
    await SubscriptionServices.getCurrentMerchantSubscriptionFromDB(merchantId);

  let planFeatures: any = {};
  if (subscription?.planId) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: subscription.planId }
    });
    planFeatures = plan?.features || {};
  }

  const limits: Record<string, number | "unlimited"> = {};

  Object.keys(planFeatures).forEach((feature) => {
    limits[feature] = planFeatures[feature]?.limit ?? "unlimited";
  });

  return { limits };
};

// Get feature usage
const getFeatureUsageFromDB = async (merchantId: string) => {
  const subscription =
    await SubscriptionServices.getCurrentMerchantSubscriptionFromDB(merchantId);

  let planFeatures: any = {};
  if (subscription?.planId) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: subscription.planId }
    });
    planFeatures = plan?.features || {};
  }

  const usage: Record<string, any> = {};

  Object.keys(planFeatures).forEach((feature) => {
    const limit = planFeatures[feature]?.limit ?? "unlimited";
    usage[feature] = {
      current: 0, // TODO: Calculate actual usage
      limit,
      percentage: limit === "unlimited" ? undefined : 0,
    };
  });

  return { usage };
};

// Fraud check (proxy to super-admin or external service)
const checkFraudFromDB = async (phone: string): Promise<FraudCheckData> => {
  // TODO: Implement actual fraud check logic
  return {
    phone,
    total_parcels: 0,
    successful_deliveries: 0,
    failed_deliveries: 0,
    success_rate: 0,
    fraud_risk: "low",
    courier_history: [],
  };
};

// Domain configuration
const getDomainConfigFromDB = async (
  merchantId: string
): Promise<DomainConfig> => {
  // TODO: Implement actual domain configuration logic
  return {
    domain: undefined,
    verified: false,
    dnsRecords: [],
  };
};

const configureDomainFromDB = async (merchantId: string, domain: string) => {
  // TODO: Implement actual domain configuration logic
  return { success: true, domain };
};

const verifyDomainFromDB = async (merchantId: string, domain: string) => {
  // TODO: Implement actual domain verification logic
  return {
    verified: false,
    dnsRecords: [],
  };
};

const removeDomainFromDB = async (merchantId: string) => {
  // TODO: Implement actual domain removal logic
  return { success: true };
};

// Get super admin data
const getSuperAdminDataFromDB = async (merchantId: string, type?: string) => {
  switch (type) {
    case "subscription":
      const subscription =
        await SuperAdminServices.getMerchantSubscriptionFromDB(merchantId);
      return { subscription };
    case "deployment":
      const deploymentData =
        await SuperAdminServices.getMerchantDeploymentFromDB(merchantId);
      return deploymentData;
    case "database":
      const databaseData =
        await SuperAdminServices.getMerchantDatabaseFromDB(merchantId);
      return databaseData;
    case "full":
    default:
      return await SuperAdminServices.getFullMerchantDataFromDB(merchantId);
  }
};

// Email settings - using EmailTemplate module
const getEmailSettingsFromDB = async (merchantId: string) => {
  const { EmailProviderServices } = await import(
    "../EmailTemplate/emailProvider.service"
  );
  return await EmailProviderServices.getEmailProviderSettingsFromDB(merchantId);
};

const updateEmailSettingsFromDB = async (merchantId: string, payload: any) => {
  const { EmailProviderServices } = await import(
    "../EmailTemplate/emailProvider.service"
  );
  return await EmailProviderServices.updateEmailProviderSettingsFromDB(
    merchantId,
    payload
  );
};


const testEmailSettingsFromDB = async (payload: any) => {
  // TODO: Implement email test with actual email sending service
  return {
    ok: true,
    message: "Test email sent successfully (placeholder)",
  };
};

// Email templates - using EmailTemplate module
const getEmailTemplatesFromDB = async (merchantId: string, event?: string) => {
  const { EmailTemplateServices } = await import(
    "../EmailTemplate/emailTemplate.service"
  );
  return await EmailTemplateServices.getEmailTemplatesFromDB(
    merchantId,
    event as any
  );
};

const updateEmailTemplatesFromDB = async (
  merchantId: string,
  payload: {
    event: string;
    template?: any;
    [key: string]: any;
  }
) => {
  const { EmailTemplateServices } = await import(
    "../EmailTemplate/emailTemplate.service"
  );

  // If template is provided, use it; otherwise use the entire payload as template data (excluding event)
  const { event, template, ...rest } = payload;
  const templateData = template || rest;

  return await EmailTemplateServices.updateEmailTemplateFromDB(
    event as any,
    templateData,
    merchantId
  );
};

const createEmailTemplateFromDB = async (merchantId: string, payload: any) => {
  const { EmailTemplateServices } = await import(
    "../EmailTemplate/emailTemplate.service"
  );
  return await EmailTemplateServices.createEmailTemplateFromDB(
    payload,
    merchantId
  );
};

export const MerchantServices = {
  getMerchantContextFromDB,
  getMerchantDataFromBrandConfig,
  getMerchantPlanSubscriptionFromDB,
  checkFeaturesFromDB,
  getFeatureLimitsFromDB,
  getFeatureUsageFromDB,
  checkFraudFromDB,
  getDomainConfigFromDB,
  configureDomainFromDB,
  verifyDomainFromDB,
  removeDomainFromDB,
  getSuperAdminDataFromDB,
  getEmailSettingsFromDB,
  updateEmailSettingsFromDB,
  testEmailSettingsFromDB,
  getEmailTemplatesFromDB,
  updateEmailTemplatesFromDB,
  createEmailTemplateFromDB,
};
