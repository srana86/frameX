/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { SuperAdminServices } from "../SuperAdmin/superAdmin.service";
import { ConfigServices } from "../Config/config.service";
import { SubscriptionServices } from "../Subscription/subscription.service";
import {
  TenantContext,
  FraudCheckData,
  DomainConfig,
  FeatureCheck,
} from "./tenant.interface";

// Get tenant context
const getTenantContextFromDB = async (tenantId: string) => {
  if (!tenantId) throw new AppError(StatusCodes.BAD_REQUEST, "Tenant ID required");

  // Retrieve tenant from User table (as tenants are Users in the platform)
  const userTenant = await prisma.user.findFirst({
    where: { id: tenantId } // tenantId is guaranteed to be string here due to check above
  });

  if (!userTenant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tenant not found");
  }

  // Use tenantId to get full tenant data
  if (!userTenant.tenantId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Tenant has no associated settings");
  }

  const fullData = await SuperAdminServices.getFullTenantDataFromDB(
    userTenant.tenantId
  );

  const context: TenantContext = {
    tenant: {
      id: userTenant.id,
      name: userTenant.name || "",
      email: userTenant.email,
      status: (userTenant.status || "ACTIVE") as any, // Cast to any or specific enum if known
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

// Get tenant data from brand config
const getTenantDataFromBrandConfig = async (tenantId: string) => {
  const brandConfig = await ConfigServices.getBrandConfigFromDB(tenantId);
  return {
    tenant: {
      name: brandConfig.brandName,
      logo: brandConfig.logo,
      // Add other brand config fields as needed
    },
  };
};

// Get tenant plan subscription
const getTenantPlanSubscriptionFromDB = async (tenantId: string) => {
  const subscription =
    await SubscriptionServices.getTenantSubscriptionFromDB(tenantId);
  return subscription;
};

// Check features
const checkFeaturesFromDB = async (tenantId: string, features: string[]) => {
  const subscription =
    await SubscriptionServices.getTenantSubscriptionFromDB(tenantId);

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
const getFeatureLimitsFromDB = async (tenantId: string) => {
  const subscription =
    await SubscriptionServices.getTenantSubscriptionFromDB(tenantId);

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

const getFeatureUsageFromDB = async (tenantId: string) => {
  const subscription =
    await SubscriptionServices.getTenantSubscriptionFromDB(tenantId);

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
  tenantId: string
): Promise<DomainConfig> => {
  // TODO: Implement actual domain configuration logic
  return {
    domain: undefined,
    verified: false,
    dnsRecords: [],
  };
};

const configureDomainFromDB = async (tenantId: string, domain: string) => {
  // TODO: Implement actual domain configuration logic
  return { success: true, domain };
};

const verifyDomainFromDB = async (tenantId: string, domain: string) => {
  // TODO: Implement actual domain verification logic
  return {
    verified: false,
    dnsRecords: [],
  };
};

const removeDomainFromDB = async (tenantId: string) => {
  // TODO: Implement actual domain removal logic
  return { success: true };
};

// Get super admin data
const getSuperAdminDataFromDB = async (tenantId: string, type?: string) => {
  switch (type) {
    case "subscription":
      const subscription =
        await SuperAdminServices.getTenantSubscriptionFromDB(tenantId);
      return { subscription };
    case "deployment":
      const deploymentData =
        await SuperAdminServices.getTenantDeploymentFromDB(tenantId);
      return deploymentData;
    case "database":
      const databaseData =
        await SuperAdminServices.getTenantDatabaseFromDB(tenantId);
      return databaseData;
    case "full":
    default:
      return await SuperAdminServices.getFullTenantDataFromDB(tenantId);
  }
};

// Email settings - using EmailTemplate module
const getEmailSettingsFromDB = async (tenantId: string) => {
  const { EmailProviderServices } = await import(
    "../EmailTemplate/emailProvider.service"
  );
  return await EmailProviderServices.getEmailProviderSettingsFromDB(tenantId);
};

const updateEmailSettingsFromDB = async (tenantId: string, payload: any) => {
  const { EmailProviderServices } = await import(
    "../EmailTemplate/emailProvider.service"
  );
  return await EmailProviderServices.updateEmailProviderSettingsFromDB(
    tenantId,
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
const getEmailTemplatesFromDB = async (tenantId: string, event?: string) => {
  const { EmailTemplateServices } = await import(
    "../EmailTemplate/emailTemplate.service"
  );
  return await EmailTemplateServices.getEmailTemplatesFromDB(
    tenantId,
    event as any
  );
};

const updateEmailTemplatesFromDB = async (
  tenantId: string,
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
    tenantId
  );
};

const createEmailTemplateFromDB = async (tenantId: string, payload: any) => {
  const { EmailTemplateServices } = await import(
    "../EmailTemplate/emailTemplate.service"
  );
  return await EmailTemplateServices.createEmailTemplateFromDB(
    payload,
    tenantId
  );
};

export const TenantServices = {
  getTenantContextFromDB,
  getTenantDataFromBrandConfig,
  getTenantPlanSubscriptionFromDB,
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

