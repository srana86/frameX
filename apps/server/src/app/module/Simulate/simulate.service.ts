/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, DeploymentStatus } from "@framex/database";
import config from "../../../config/index";

// Skip physical DB creation as we use single-DB multi-tenant architecture.
// We only need to register the tenant database metadata for potential future use or reference.
const createDatabase = async (tenantId: string) => {
  if (!tenantId) throw new Error("Tenant ID is required");

  // In single-DB architecture, the databaseUrl is the shared connection string.
  // We don't encrypt it here as it's just the reference to the main DB.

  const connectionString = config.database_url;
  const databaseName = `tenant_${tenantId}`; // conceptual name

  // Check if config exists
  const existing = await prisma.databaseInfo.findUnique({ where: { tenantId } });

  if (existing) {
    return {
      success: true,
      databaseName,
      message: `Database config already exists for ${tenantId}`,
    };
  }

  await prisma.databaseInfo.create({
    data: {
      tenantId,
      databaseName,
      status: "active",
      databaseUrl: connectionString, // Storing raw for internal use, though typically we shouldn't expose.
    }
  });

  // Initialize BrandConfig (Tenant Settings)
  // This replaces the old brand_config initialization from create-database route

  // Check/Create BrandConfig
  const existingBrand = await prisma.brandConfig.findUnique({ where: { tenantId } });
  if (!existingBrand) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    await prisma.brandConfig.create({
      data: {
        tenantId,
        name: tenant?.name || "My Store",
        // Default values
        currencyIso: "BDT",
        currencySymbol: "৳"
      }
    });
  }

  return {
    success: true,
    databaseName,
    message: `Tenant resources initialized successfully for ${tenantId}`,
  };
};

const createDeployment = async (payload: {
  tenantId: string;
  tenantName: string;
  tenantEmail?: string;
  databaseName: string;
  customSubdomain?: string;
}) => {
  const { tenantId, tenantName, databaseName, customSubdomain } = payload;

  if (!tenantId || !tenantName || !databaseName) {
    throw new Error("Tenant ID, name, and database name are required");
  }

  // VPS Deployment Strategy:
  // In a VPS single-DB setup, "deployment" essentially means:
  // 1. The tenant data is initialized (BrandConfig, User, etc - mostly handled).
  // 2. The tenant can access the system via their subdomain/domain mapping.
  // 3. We create a Deployment record to track this "activation".

  const subdomainToUse = customSubdomain || `${tenantId}-store`;
  const mainDomain = process.env.BASE_DOMAIN || "framextech.com";
  const developedUrl = `https://${subdomainToUse}.${mainDomain}`;
  const status: DeploymentStatus = "COMPLETED";

  const logs = {
    projectId: `vps_${tenantId}`,
    deploymentId: `vps_deploy_${Date.now()}`,
    provider: "vps",
    url: developedUrl
  };

  console.log(`[Simulate] VPS Deployment record created for ${tenantId} at ${developedUrl}`);

  // Create Deployment Record
  const newDeployment = await prisma.deployment.create({
    data: {
      tenantId,
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
