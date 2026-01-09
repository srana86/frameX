/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, FeatureRequestStatus } from "@framex/database";

const getAllFeatureRequests = async (status?: string, merchantId?: string) => {
  const where: any = {};
  if (status) where.status = status.toUpperCase() as FeatureRequestStatus;
  if (merchantId) where.tenantId = merchantId;

  const requests = await prisma.featureRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return { success: true, data: requests };
};

const getFeatureRequestById = async (id: string) => {
  const request = await prisma.featureRequest.findUnique({
    where: { id }
  });
  if (!request) throw new Error("Feature request not found");
  return request;
};

const createFeatureRequest = async (payload: any) => {
  const { title, description, merchantId, status } = payload;

  let prismaStatus: FeatureRequestStatus = FeatureRequestStatus.PENDING;
  if (status === "in_review") prismaStatus = FeatureRequestStatus.IN_PROGRESS;
  if (status === "resolved") prismaStatus = FeatureRequestStatus.COMPLETED;

  const request = await prisma.featureRequest.create({
    data: {
      title,
      description,
      tenantId: merchantId,
      status: prismaStatus,
    }
  });

  return { success: true, data: request };
};

const updateFeatureRequest = async (id: string, payload: any) => {
  const updates: any = {};
  if (payload.status) {
    if (payload.status === "new") updates.status = FeatureRequestStatus.PENDING;
    if (payload.status === "in_review") updates.status = FeatureRequestStatus.IN_PROGRESS;
    if (payload.status === "resolved") updates.status = FeatureRequestStatus.COMPLETED;
  }

  const request = await prisma.featureRequest.update({
    where: { id },
    data: updates
  });

  return { success: true, data: request };
};

const deleteFeatureRequest = async (id: string) => {
  await prisma.featureRequest.delete({ where: { id } });
  return { success: true, message: "Deleted successfully" };
};

export const FeatureRequestServices = {
  getAllFeatureRequests,
  getFeatureRequestById,
  createFeatureRequest,
  updateFeatureRequest,
  deleteFeatureRequest,
};
