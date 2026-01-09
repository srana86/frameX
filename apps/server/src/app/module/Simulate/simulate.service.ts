/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, DeploymentStatus } from "@framex/database";
import config from "../../../config/index";

// Skip physical DB creation as we use single-DB multi-tenant architecture.
// We only need to register the merchant database metadata for potential future use or reference.
const createDatabase = async (merchantId: string) => {
  if (!merchantId) throw new Error("Merchant ID is required");

  // In single-DB architecture, the databaseUrl is the shared connection string.
  // We don't encrypt it here as it's just the reference to the main DB.

  const connectionString = config.database_url;
  const databaseName = `merchant_${merchantId}`; // conceptual name

  // Check if config exists
  const existing = await prisma.databaseInfo.findUnique({ where: { merchantId } });

  if (existing) {
    return {
      success: true,
      databaseName,
      message: `Database config already exists for ${merchantId}`,
    };
  }

  await prisma.databaseInfo.create({
    data: {
      merchantId,
      databaseName,
      status: "active",
      databaseUrl: connectionString, // Storing raw for internal use, though typically we shouldn't expose.
    }
  });

  // Initialize BrandConfig (Tenant Settings)
  // This replaces the old brand_config initialization from create-database route

  // Check/Create BrandConfig
  const existingBrand = await prisma.brandConfig.findUnique({ where: { tenantId: merchantId } });
  if (!existingBrand) {
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    await prisma.brandConfig.create({
      data: {
        tenantId: merchantId,
        name: merchant?.name || "My Store",
        // Default values
        currencyIso: "BDT",
        currencySymbol: "৳"
      }
    });
  }

  return {
    success: true,
    databaseName,
    message: `Tenant resources initialized successfully for ${merchantId}`,
  };
};

const createDeployment = async (payload: {
  merchantId: string;
  merchantName: string;
  merchantEmail?: string;
  databaseName: string;
  customSubdomain?: string;
}) => {
  const { merchantId, merchantName, databaseName, customSubdomain } = payload;

  if (!merchantId || !merchantName || !databaseName) {
    throw new Error("Merchant ID, name, and database name are required");
  }

  // VPS Deployment Strategy:
  // In a VPS single-DB setup, "deployment" essentially means:
  // 1. The tenant data is initialized (BrandConfig, User, etc - mostly handled).
  // 2. The tenant can access the system via their subdomain/domain mapping.
  // 3. We create a Deployment record to track this "activation".

  const subdomainToUse = customSubdomain || `${merchantId}-store`;
  const mainDomain = process.env.BASE_DOMAIN || "framextech.com";
  const developedUrl = `https://${subdomainToUse}.${mainDomain}`;
  const status: DeploymentStatus = "COMPLETED";

  const logs = {
    projectId: `vps_${merchantId}`,
    deploymentId: `vps_deploy_${Date.now()}`,
    provider: "vps",
    url: developedUrl
  };

  console.log(`[Simulate] VPS Deployment record created for ${merchantId} at ${developedUrl}`);

  // Create Deployment Record
  const newDeployment = await prisma.deployment.create({
    data: {
      merchantId,
      status, // COMPLETED
      domain: subdomainToUse,
      deploymentUrl: developedUrl,
      logs,
      startedAt: new Date(),
      completedAt: new Date()
    }
  });

  return {
    success: true,
    deployment: newDeployment,
    message: "Deployment active (VPS Mode)",
  };
};

const getDeploymentStatus = async (deploymentId: string) => {
  if (!deploymentId) throw new Error("Deployment ID required");

  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId }
  });

  if (!deployment) throw new Error("Deployment not found");

  // For VPS mode, status is managed internally, no external API check needed usually.

  return {
    success: true,
    status: deployment.status,
    url: deployment.deploymentUrl,
    deploymentId: (deployment.logs as any)?.deploymentId,
  };
};

export const SimulateServices = {
  createDatabase,
  createDeployment,
  getDeploymentStatus,
};

