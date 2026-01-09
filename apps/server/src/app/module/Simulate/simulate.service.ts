/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import crypto from "crypto";
import config from "../../../config/index";

const ENCRYPTION_KEY = config.encryption_key || "";

function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    return text;
  }
  const algorithm = "aes-256-cbc";
  const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

const createDatabase = async (merchantId: string) => {
  if (!merchantId) throw new Error("Merchant ID is required");

  const databaseName = `merchant_${merchantId}_db`;

  // In Postgres migration, we might create a schema or separate DB. 
  // For simplicity, we assume we are using a shared DB with tenantId isolation (Column-based multi-tenancy) 
  // which we implemented in the migration (adding tenantId to all tables).
  // So "creating a database" is metadata-only or creating a user?
  // The Simulate service implies creating a dedicated environment.
  // We will store the metadata. Physical creation is skipped as we switched strategy.

  const connectionString = config.database_url; // Shared DB
  const encryptedConnectionString = encrypt(connectionString || "");

  const databaseRecord = await prisma.databaseInfo.create({
    data: {
      merchantId,
      databaseName,
      status: "active",
      // useSharedDatabase: true, // Schema doesn't have this field? database.model.ts had it. 
      // Schema lines 991-1000: id, merchantId, databaseName, databaseUrl, status, size
      databaseUrl: encryptedConnectionString,
    }
  });

  return {
    success: true,
    databaseName,
    collectionsCreated: 0,
    message: `Database ${databaseName} registered successfully (Shared Tenant)`,
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

  const skipVercelDeployment = process.env.SKIP_VERCEL_DEPLOYMENT === "true";

  const subdomain = customSubdomain || `${merchantId}-store`;
  const deploymentUrl = skipVercelDeployment
    ? `http://localhost:3000`
    : `https://${subdomain}.vercel.app`;

  // Prisma Deployment model: id, merchantId, templateId, status, domain, deploymentUrl, logs, startedAt, completedAt...
  // Mapping fields:
  // deploymentStatus -> status (Enum)
  // deploymentUrl -> deploymentUrl
  // subdomain -> domain
  // logs -> used to store extra fields like projectId, deploymentId since they are missing in schema explicit columns

  const logs = {
    projectId: skipVercelDeployment ? `mock_project_${merchantId}` : undefined,
    deploymentId: skipVercelDeployment ? `mock_deployment_${Date.now()}` : undefined,
    deploymentProvider: skipVercelDeployment ? "local" : "vercel"
  };

  const deployment = await prisma.deployment.create({
    data: {
      merchantId,
      // templateId?
      status: skipVercelDeployment ? "COMPLETED" : "PENDING", // Mapping 'active' to COMPLETED? Or use IN_PROGRESS?
      // Enum: PENDING, IN_PROGRESS, COMPLETED, FAILED.
      // previous code used 'active'/'pending'. 
      domain: subdomain,
      deploymentUrl,
      logs,
      startedAt: new Date(),
      completedAt: skipVercelDeployment ? new Date() : undefined
    }
  });

  return {
    success: true,
    deployment,
    message: "Deployment created successfully",
  };
};

const getDeploymentStatus = async (deploymentId: string) => {
  if (!deploymentId) throw new Error("Deployment ID required");

  // Since deploymentId is not the primary key (id is uuid), we search logs? 
  // OR we assume deploymentId arg refers to our internal uuid 'id' or the external 'deploymentId' from logs.
  // previous code searched `findOne({ deploymentId })`.
  // I will search by `logs` field? No, specific json lookup is hard.
  // I will search by `id` (primary key). The caller should pass the correct ID.

  const deployment = await prisma.deployment.findFirst({
    where: { id: deploymentId }
  });

  if (!deployment) throw new Error("Deployment not found");

  // Extract external deploymentId from logs
  const logs: any = deployment.logs || {};

  return {
    success: true,
    status: deployment.status,
    url: deployment.deploymentUrl,
    deploymentId: logs.deploymentId,
  };
};

export const SimulateServices = {
  createDatabase,
  createDeployment,
  getDeploymentStatus,
};
