/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import { TPromotionalBanner } from "./promotionalBanner.interface";

// Get promotional banner
const getPromotionalBannerFromDB = async (tenantId: string) => {
  // Service treats it as a singleton. In multi-tenant, it's one per tenant.
  // We can assume there's one record per tenant or findFirst
  let banner = await prisma.promotionalBanner.findFirst({
    where: { tenantId },
  });

  if (!banner) {
    // Return a default structure or create one?
    // Mongoose code created one on fly if distinct ID "promotional-banner" not found.
    // Here we should probably return null or a default object, strict creation might be better suited for an admin setup action.
    // But aligning with logic: create on first fetch if not exists (lazy init)
    banner = await prisma.promotionalBanner.create({
      data: {
        tenantId,
        isActive: false,
      },
    });
  }
  return banner;
};

// Update promotional banner
const updatePromotionalBannerIntoDB = async (
  tenantId: string,
  payload: Partial<TPromotionalBanner>
) => {
  // Ensure exists
  let banner = await prisma.promotionalBanner.findFirst({
    where: { tenantId },
  });

  if (!banner) {
    banner = await prisma.promotionalBanner.create({
      data: {
        tenantId,
        isActive: false,
      },
    });
  }

  const updateData: any = { ...payload };
  if (payload.enabled !== undefined) {
    updateData.isActive = payload.enabled;
    delete updateData.enabled;
  }

  const result = await prisma.promotionalBanner.update({
    where: { id: banner.id },
    data: updateData,
  });
  return result;
};

export const PromotionalBannerServices = {
  getPromotionalBannerFromDB,
  updatePromotionalBannerIntoDB,
};
