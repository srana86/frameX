import { Schema, model } from "mongoose";
import { TPromotionalBanner } from "./promotionalBanner.interface";

const promotionalBannerSchema = new Schema<TPromotionalBanner>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "promotional-banner",
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    text: String,
    link: String,
    backgroundColor: String,
    textColor: String,
  },
  {
    timestamps: true,
    collection: "promotional_banner",
  }
);

export const PromotionalBanner = model<TPromotionalBanner>(
  "PromotionalBanner",
  promotionalBannerSchema
);
