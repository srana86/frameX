/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

// Get product reviews
const getProductReviewsFromDB = async (tenantId: string, productIdOrSlug: string) => {
  const product = await prisma.product.findFirst({
    where: {
      tenantId,
      OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }]
    }
  });

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  const reviews = await prisma.review.findMany({
    where: {
      tenantId,
      // Ideally link by productId, but old logic linked by slug.
      // We should probably rely on productId if possible, or support slug.
      // Assuming Review model has productSlug field as per Mongoose schema.
      productSlug: product.slug
    },
    orderBy: { createdAt: "desc" }
  });

  return reviews.map((r) => ({
    id: r.id,
    name: r.name,
    initials: r.initials,
    rating: Number(r.rating),
    date: r.date || r.createdAt.toLocaleDateString(),
    verified: r.verified,
    review: r.review,
    avatarColor: r.avatarColor,
    images: r.images,
    createdAt: r.createdAt,
  }));
};

// Create review
const createProductReviewIntoDB = async (
  tenantId: string,
  productIdOrSlug: string,
  payload: any
) => {
  const product = await prisma.product.findFirst({
    where: {
      tenantId,
      OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }]
    }
  });

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  const initials = (payload.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

  const review = await prisma.review.create({
    data: {
      tenantId,
      productSlug: product.slug, // Storing slug to match Mongoose logic
      productId: product.id,     // Also storing ID for better relation
      rating: Number(payload.rating),
      review: String(payload.review),
      name: String(payload.name),
      initials,
      avatarColor,
      images: payload.images || [],
      verified: false,
      date: "Just now"
    }
  });

  return review;
};

export const ReviewServices = {
  getProductReviewsFromDB,
  createProductReviewIntoDB,
};
