import { FeatureRequest } from "./featureRequest.model";
import { toPlainObjectArray, toPlainObject } from "../../utils/mongodb";
import { IFeatureRequest } from "./featureRequest.interface";

const getAllFeatureRequests = async (status?: string, merchantId?: string) => {
  const query: Record<string, any> = {};
  if (status) query.status = status;
  if (merchantId) query.merchantId = merchantId;

  const requests = await FeatureRequest.find(query)
    .sort({ createdAt: -1 })
    .limit(200);
  return {
    success: true,
    data: toPlainObjectArray<IFeatureRequest>(requests),
  };
};

const getFeatureRequestById = async (id: string) => {
  const request = await FeatureRequest.findOne({ id });
  if (!request) {
    throw new Error("Feature request not found");
  }
  return toPlainObject<IFeatureRequest>(request);
};

const createFeatureRequest = async (payload: Partial<IFeatureRequest>) => {
  const {
    title,
    description,
    priority = "medium",
    contactEmail,
    contactPhone,
    merchantId,
    status = "new",
  } = payload;

  if (!title || !description || !merchantId) {
    throw new Error("title, description, and merchantId are required");
  }

  const safePriority: IFeatureRequest["priority"] = [
    "low",
    "medium",
    "high",
  ].includes(priority as string)
    ? (priority as IFeatureRequest["priority"])
    : "medium";
  const safeStatus: IFeatureRequest["status"] = [
    "new",
    "in_review",
    "resolved",
  ].includes(status as string)
    ? (status as IFeatureRequest["status"])
    : "new";

  const requestData: IFeatureRequest = {
    id: `fr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: String(title).trim(),
    description: String(description).trim(),
    priority: safePriority,
    contactEmail: contactEmail ? String(contactEmail).trim() : undefined,
    contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
    merchantId: String(merchantId).trim(),
    status: safeStatus,
    createdAt: new Date().toISOString(),
  };

  const request = await FeatureRequest.create(requestData);
  return {
    success: true,
    data: toPlainObject<IFeatureRequest>(request),
  };
};

const updateFeatureRequest = async (
  id: string,
  payload: { status?: string; priority?: string }
) => {
  if (!id) {
    throw new Error("id is required");
  }

  const updates: Record<string, any> = {};
  if (payload.status) {
    if (!["new", "in_review", "resolved"].includes(payload.status)) {
      throw new Error("Invalid status");
    }
    updates.status = payload.status;
  }
  if (payload.priority) {
    if (!["low", "medium", "high"].includes(payload.priority)) {
      throw new Error("Invalid priority");
    }
    updates.priority = payload.priority;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No updates provided");
  }

  const request = await FeatureRequest.findOneAndUpdate(
    { id },
    { $set: updates },
    { new: true }
  );
  if (!request) {
    throw new Error("Not found");
  }

  return {
    success: true,
    data: toPlainObject<IFeatureRequest>(request),
  };
};

const deleteFeatureRequest = async (id: string) => {
  const request = await FeatureRequest.findOne({ id });
  if (!request) {
    throw new Error("Feature request not found");
  }

  await FeatureRequest.deleteOne({ id });
  return { success: true, message: "Feature request deleted successfully" };
};

export const FeatureRequestServices = {
  getAllFeatureRequests,
  getFeatureRequestById,
  createFeatureRequest,
  updateFeatureRequest,
  deleteFeatureRequest,
};
