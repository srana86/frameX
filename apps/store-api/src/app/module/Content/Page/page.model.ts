import { Schema, model } from "mongoose";
import { TPage, TPageCategory } from "./page.interface";

const pageSchema = new Schema<TPage>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: String, // Changed from categoryId to category to match FrameX-Store
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
    collection: "footer_pages",
  }
);

const pageCategorySchema = new Schema<TPageCategory>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "footer_categories",
  }
);

export const Page = model<TPage>("Page", pageSchema);
export const PageCategory = model<TPageCategory>(
  "PageCategory",
  pageCategorySchema
);
