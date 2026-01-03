/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Review } from "./review.model";
import { Product } from "../Product/product.model";
import { TReview } from "./review.interface";

// Get product reviews (matching FrameX-Store format)
const getProductReviewsFromDB = async (productIdOrSlug: string) => {
  // First, try to find product by slug or id
  const product = await Product.findOne({
    $or: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
    isDeleted: false,
  });

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  const productSlug = product.slug || productIdOrSlug;

  const reviews = await Review.find({ productSlug })
    .sort({ createdAt: -1 })
    .lean();

  // Format reviews to match FrameX-Store response format
  const formattedReviews = reviews.map((r: any) => ({
    id: String(r._id || r.id || `REV${Date.now()}`),
    name: r.name,
    initials:
      r.initials ||
      (r.name || "")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    rating: Number(r.rating ?? 5),
    date:
      r.date ||
      (r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Just now"),
    verified: Boolean(r.verified ?? false),
    review: r.review || r.text || "",
    avatarColor: r.avatarColor || "from-primary/20 to-accent/20",
    images: Array.isArray(r.images) ? r.images : [],
    createdAt: r.createdAt,
  }));

  return formattedReviews;
};

// Create product review (matching FrameX-Store format)
const createProductReviewIntoDB = async (
  productIdOrSlug: string,
  payload: {
    rating: number;
    review: string;
    name: string;
    images?: string[];
  }
) => {
  // Find product by id or slug
  const product = await Product.findOne({
    $or: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
    isDeleted: false,
  });

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  const productSlug = product.slug || productIdOrSlug;

  // Generate initials from name
  const initials = (payload.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate avatar color based on name hash
  const colors = [
    "from-primary/20 to-accent/20",
    "from-blue-500/20 to-purple-500/20",
    "from-green-500/20 to-teal-500/20",
    "from-orange-500/20 to-red-500/20",
    "from-pink-500/20 to-rose-500/20",
    "from-indigo-500/20 to-blue-500/20",
    "from-cyan-500/20 to-blue-500/20",
    "from-emerald-500/20 to-green-500/20",
    "from-violet-500/20 to-purple-500/20",
    "from-amber-500/20 to-orange-500/20",
    "from-fuchsia-500/20 to-pink-500/20",
    "from-slate-500/20 to-gray-500/20",
  ];
  const colorIndex = (payload.name || "").charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];

  const reviewDoc: any = {
    productSlug,
    rating: Number(payload.rating),
    review: String(payload.review),
    name: String(payload.name),
    initials,
    avatarColor,
    images: Array.isArray(payload.images) ? payload.images : [],
    verified: false, // In a real app, verify if user purchased the product
    date: "Just now",
  };

  const review = await Review.create(reviewDoc);

  // Format response to match FrameX-Store
  return {
    ...review.toObject(),
    id: String(review._id),
  };
};

export const ReviewServices = {
  getProductReviewsFromDB,
  createProductReviewIntoDB,
};
