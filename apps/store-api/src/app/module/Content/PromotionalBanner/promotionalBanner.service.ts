/* eslint-disable @typescript-eslint/no-explicit-any */
import { PromotionalBanner } from "./promotionalBanner.model";
import { TPromotionalBanner } from "./promotionalBanner.interface";

// Get promotional banner
const getPromotionalBannerFromDB = async () => {
  let banner = await PromotionalBanner.findOne({ id: "promotional-banner" });
  if (!banner) {
    banner = await PromotionalBanner.create({
      id: "promotional-banner",
      enabled: false,
    });
  }
  return banner;
};

// Update promotional banner
const updatePromotionalBannerIntoDB = async (
  payload: Partial<TPromotionalBanner>
) => {
  const result = await PromotionalBanner.findOneAndUpdate(
    { id: "promotional-banner" },
    payload,
    { new: true, upsert: true, runValidators: true }
  );
  return result;
};

export const PromotionalBannerServices = {
  getPromotionalBannerFromDB,
  updatePromotionalBannerIntoDB,
};
