/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import { FeatureRequestStatus } from "@prisma/client";

const getAllFeatureRequests = async (status?: string, merchantId?: string) => {
  const where: any = {};
  if (status) where.status = status.toUpperCase() as FeatureRequestStatus;
  if (merchantId) where.tenantId = merchantId; // Schema uses tenantId or userId? 
  // Schema lines 977: tenantId String?, userId String?
  // Mongoose used `merchantId`. I'll map to `tenantId`.

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

  // Status mapping
  // Prisma Enum: PENDING, APPROVED, IN_PROGRESS, COMPLETED, REJECTED
  // Mongoose: new, in_review, resolved
  // Mapping: new -> PENDING, in_review -> IN_PROGRESS, resolved -> COMPLETED
  let prismaStatus: FeatureRequestStatus = FeatureRequestStatus.PENDING;
  if (status === "in_review") prismaStatus = FeatureRequestStatus.IN_PROGRESS;
  if (status === "resolved") prismaStatus = FeatureRequestStatus.COMPLETED;

  const request = await prisma.featureRequest.create({
    data: {
      title,
      description,
      tenantId: merchantId,
      status: prismaStatus,
      // priority? Schema lines 977-989: NO priority field.
      // votes Int @default(0)
      // I'll ignore priority or add to description.
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

  // priority update? Ignore.

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
