/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { SuperAdminServices } from "../SuperAdmin/superAdmin.service";
import { ConfigServices } from "../Config/config.service";
import { SubscriptionServices } from "../Subscription/subscription.service";
import { User } from "../User/user.model";
import {
  MerchantContext,
  FraudCheckData,
  DomainConfig,
  FeatureCheck,
} from "./merchant.interface";

// Get merchant context
const getMerchantContextFromDB = async (merchantId?: string) => {
  const merchant = await User.findOne({
    id: merchantId || "",
    role: "merchant",
    isDeleted: false,
  });

  if (!merchant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Merchant not found");
  }

  const fullData = await SuperAdminServices.getFullMerchantDataFromDB(
    merchant.id
  );

  const context: MerchantContext = {
    merchant: {
      id: merchant.id,
      name: merchant.fullName,
      email: merchant.email || "",
      status: merchant.status || "in-progress",
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
const getMerchantDataFromBrandConfig = async () => {
  const brandConfig = await ConfigServices.getBrandConfigFromDB();
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
  const planFeatures = subscription?.planId
    ? await import("../Subscription/subscription.model")
        .then((m) => m.SubscriptionPlan.findOne({ id: subscription.planId }))
        .then((plan) => plan?.features || {})
    : {};

  const result: Record<string, FeatureCheck> = {};

  for (const feature of features) {
    const featureConfig = (planFeatures as any)?.[feature];
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

  const planFeatures = subscription?.planId
    ? await import("../Subscription/subscription.model")
        .then((m) => m.SubscriptionPlan.findOne({ id: subscription.planId }))
        .then((plan) => plan?.features || {})
    : {};

  const limits: Record<string, number | "unlimited"> = {};

  Object.keys(planFeatures).forEach((feature) => {
    limits[feature] = (planFeatures as any)[feature]?.limit ?? "unlimited";
  });

  return { limits };
};

// Get feature usage
const getFeatureUsageFromDB = async (merchantId: string) => {
  const subscription =
    await SubscriptionServices.getCurrentMerchantSubscriptionFromDB(merchantId);

  const planFeatures = subscription?.planId
    ? await import("../Subscription/subscription.model")
        .then((m) => m.SubscriptionPlan.findOne({ id: subscription.planId }))
        .then((plan) => plan?.features || {})
    : {};

  const usage: Record<string, any> = {};

  Object.keys(planFeatures).forEach((feature) => {
    const limit = (planFeatures as any)[feature]?.limit ?? "unlimited";
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
  // This should proxy to super-admin fraud check service or external API
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
const getEmailSettingsFromDB = async () => {
  const { EmailProviderServices } = await import(
    "../EmailTemplate/emailProvider.service"
  );
  const merchantId = undefined; // Get from context if available
  return await EmailProviderServices.getEmailProviderSettingsFromDB(merchantId);
};

const updateEmailSettingsFromDB = async (payload: any) => {
  const { EmailProviderServices } = await import(
    "../EmailTemplate/emailProvider.service"
  );
  const merchantId = undefined; // Get from context if available
  return await EmailProviderServices.updateEmailProviderSettingsFromDB(
    payload,
    merchantId
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
const getEmailTemplatesFromDB = async (event?: string) => {
  const { EmailTemplateServices } = await import(
    "../EmailTemplate/emailTemplate.service"
  );
  const merchantId = undefined; // Get from context if available
  return await EmailTemplateServices.getEmailTemplatesFromDB(
    merchantId,
    event as any
  );
};

const updateEmailTemplatesFromDB = async (payload: {
  event: string;
  template?: any;
  [key: string]: any;
}) => {
  const { EmailTemplateServices } = await import(
    "../EmailTemplate/emailTemplate.service"
  );
  const merchantId = undefined; // Get from context if available

  // If template is provided, use it; otherwise use the entire payload as template data (excluding event)
  const { event, template, ...rest } = payload;
  const templateData = template || rest;

  return await EmailTemplateServices.updateEmailTemplateFromDB(
    event as any,
    templateData,
    merchantId
  );
};

const createEmailTemplateFromDB = async (payload: any) => {
  const { EmailTemplateServices } = await import(
    "../EmailTemplate/emailTemplate.service"
  );
  const merchantId = undefined; // Get from context if available
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
