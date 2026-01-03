import { Merchant } from "./merchant.model";
import { Subscription } from "../Subscription/subscription.model";
import { Plan } from "../Plan/plan.model";
import { Deployment } from "../Deployment/deployment.model";
import { Database } from "../Database/database.model";
import { toPlainObjectArray, toPlainObject } from "../../utils/mongodb";
import { IMerchant } from "./merchant.interface";

const getAllMerchants = async () => {
  const merchants = await Merchant.find({}).sort({ createdAt: -1 });
  return toPlainObjectArray<IMerchant>(merchants);
};

const getMerchantById = async (id: string) => {
  const merchant = await Merchant.findOne({ id });
  return toPlainObject<IMerchant>(merchant);
};

const getMerchantFull = async (id: string) => {
  const [merchant, subscription, deployment, database] = await Promise.all([
    Merchant.findOne({ id }),
    Subscription.findOne({ merchantId: id }),
    Deployment.findOne({ $or: [{ merchantId: id }, { id }] }),
    Database.findOne({ $or: [{ merchantId: id }, { id }] }),
  ]);

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  let plan = null;
  if (subscription && subscription.planId) {
    plan = await Plan.findOne({ id: subscription.planId });
  }

  return {
    merchant: toPlainObject<IMerchant>(merchant),
    subscription: subscription ? toPlainObject(subscription) : null,
    plan: plan ? toPlainObject(plan) : null,
    deployment: deployment
      ? {
          ...(toPlainObject(deployment) || {}),
          connectionString: (deployment as any).connectionString
            ? "***encrypted***"
            : undefined,
        }
      : null,
    database: database
      ? {
          ...(toPlainObject(database) || {}),
          connectionString: (database as any).connectionString
            ? "***encrypted***"
            : undefined,
        }
      : null,
  };
};

const createMerchant = async (payload: Partial<IMerchant>) => {
  const merchantData: IMerchant = {
    id: payload.id || `merchant_${Date.now()}`,
    name: payload.name!,
    email: payload.email!,
    phone: payload.phone || "",
    status: payload.status || "active",
    customDomain: payload.customDomain || "",
    deploymentUrl: payload.deploymentUrl || "",
    subscriptionId: payload.subscriptionId || "",
    settings: payload.settings || {
      brandName: payload.name,
      currency: "USD",
      timezone: "UTC",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const merchant = await Merchant.create(merchantData);
  return toPlainObject<IMerchant>(merchant);
};

const updateMerchant = async (id: string, payload: Partial<IMerchant>) => {
  const updateData: any = {
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  // Don't allow updating the id
  delete updateData.id;

  const merchant = await Merchant.findOneAndUpdate(
    { id },
    { $set: updateData },
    { new: true }
  );
  if (!merchant) {
    throw new Error("Merchant not found");
  }
  return toPlainObject<IMerchant>(merchant);
};

const getMerchantSubscription = async (id: string) => {
  const subscription = await Subscription.findOne({ merchantId: id });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  let plan = null;
  if (subscription.planId) {
    plan = await Plan.findOne({ id: subscription.planId });
  }

  const subData = toPlainObject(subscription);
  return {
    ...(subData || {}),
    plan: plan ? toPlainObject(plan) : null,
  };
};

const getMerchantDeployment = async (id: string) => {
  const deployment = await Deployment.findOne({
    $or: [{ merchantId: id }, { id }],
  });
  if (!deployment) {
    throw new Error("Deployment not found");
  }
  return toPlainObject(deployment);
};

const getMerchantDatabase = async (id: string) => {
  const database = await Database.findOne({
    $or: [{ merchantId: id }, { id }],
  });
  if (!database) {
    throw new Error("Database not found");
  }
  const dbData = toPlainObject(database);
  return {
    ...(dbData || {}),
    connectionString: (database as any).connectionString
      ? "***encrypted***"
      : undefined,
  };
};

const updateMerchantDomain = async (id: string, customDomain: string) => {
  const merchant = await Merchant.findOneAndUpdate(
    { id },
    { $set: { customDomain, updatedAt: new Date().toISOString() } },
    { new: true }
  );
  if (!merchant) {
    throw new Error("Merchant not found");
  }
  return toPlainObject<IMerchant>(merchant);
};

const deleteMerchant = async (id: string) => {
  const merchant = await Merchant.findOne({ id });
  if (!merchant) {
    throw new Error("Merchant not found");
  }

  // Cascade deletion - delete related data
  await Promise.all([
    Subscription.deleteMany({ merchantId: id }),
    Deployment.deleteMany({ $or: [{ merchantId: id }, { id }] }),
    Database.deleteMany({ $or: [{ merchantId: id }, { id }] }),
  ]);

  await Merchant.deleteOne({ id });

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
