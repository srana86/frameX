import { Database } from "../Database/database.model";
import { Deployment } from "../Deployment/deployment.model";
import { MongoClient } from "mongodb";
import crypto from "crypto";
import config from "../../../config/index";

const MAIN_MONGODB_URI = config.database_url || "";
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

async function initializeCollections(db: any) {
  const collections = [
    "products",
    "orders",
    "categories",
    "inventory",
    "brand_config",
    "sslcommerz_config",
    "ads_config",
    "pages",
    "hero_slides",
    "users",
  ];

  const created: string[] = [];
  for (const collectionName of collections) {
    try {
      await db.createCollection(collectionName);
      created.push(collectionName);
    } catch (error: any) {
      if (error.code !== 48 && error.codeName !== "NamespaceExists") {
        throw error;
      }
    }
  }

  return created.length;
}

const createDatabase = async (merchantId: string) => {
  if (!merchantId) {
    throw new Error("Merchant ID is required");
  }

  if (!MAIN_MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  const databaseName = `merchant_${merchantId}_db`;

  // Extract base URI from connection string
  const uriParts = MAIN_MONGODB_URI.split("/");
  if (uriParts.length < 3) {
    throw new Error("Invalid MONGODB_URI format");
  }

  const baseUri = uriParts.slice(0, -1).join("/");
  const connectionString = `${baseUri}/${databaseName}`;

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(connectionString);
    await client.connect();

    const db = client.db(databaseName);
    const collectionsCreated = await initializeCollections(db);

    const encryptedConnectionString = encrypt(connectionString);

    const databaseRecord = {
      id: `db_${merchantId}_${Date.now()}`,
      merchantId,
      databaseName,
      status: "active",
      useSharedDatabase: false,
      connectionString: encryptedConnectionString,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await Database.create(databaseRecord);

    return {
      success: true,
      databaseName,
      collectionsCreated,
      message: `Database ${databaseName} created successfully`,
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
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

  // Check if Vercel deployment should be skipped
  const skipVercelDeployment = process.env.SKIP_VERCEL_DEPLOYMENT === "true";

  // Generate subdomain
  const subdomain = customSubdomain || `${merchantId}-store`;
  const deploymentUrl = skipVercelDeployment
    ? `http://localhost:3000`
    : `https://${subdomain}.vercel.app`;

  const deploymentRecord = {
    id: `deploy_${merchantId}_${Date.now()}`,
    merchantId,
    deploymentType: "subdomain" as const,
    subdomain,
    deploymentStatus: skipVercelDeployment ? "active" : ("pending" as const),
    deploymentUrl,
    deploymentProvider: skipVercelDeployment ? "local" : ("vercel" as const),
    projectId: skipVercelDeployment ? `mock_project_${merchantId}` : undefined,
    deploymentId: skipVercelDeployment
      ? `mock_deployment_${Date.now()}`
      : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await Deployment.create(deploymentRecord);

  return {
    success: true,
    deployment: deploymentRecord,
    message: "Deployment created successfully",
  };
};

const getDeploymentStatus = async (deploymentId: string) => {
  if (!deploymentId) {
    throw new Error("Deployment ID is required");
  }

  // For now, return mock status
  // TODO: Integrate with Vercel API when available
  const deployment = await Deployment.findOne({ deploymentId });

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  return {
    success: true,
    status: deployment.deploymentStatus,
    url: deployment.deploymentUrl,
    deploymentId: deployment.deploymentId,
  };
};

export const SimulateServices = {
  createDatabase,
  createDeployment,
  getDeploymentStatus,
};
