import { Schema, model } from "mongoose";
import { THeroSlide } from "./heroSlide.interface";

const heroSlideSchema = new Schema<THeroSlide>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
    },
    mobileImage: String,
    title: String,
    subtitle: String,
    description: String,
    buttonText: String,
    buttonLink: String,
    textPosition: {
      type: String,
      enum: ["left", "center", "right"],
      default: "center",
    },
    textColor: String,
    overlay: {
      type: Boolean,
      default: false,
    },
    overlayOpacity: Number,
    order: {
      type: Number,
      default: 0,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "hero_slides",
  }
);

export const HeroSlide = model<THeroSlide>("HeroSlide", heroSlideSchema);
