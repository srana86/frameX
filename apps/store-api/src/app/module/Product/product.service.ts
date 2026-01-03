/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Product } from "./product.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { TProduct } from "./product.interface";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { Review } from "../Review/review.model";
import { Category } from "./category.model";

// Get all products with pagination, filter, and search
const getAllProductsFromDB = async (query: Record<string, unknown>) => {
  // Query products where isDeleted is false or doesn't exist (for backward compatibility)
  const productQuery = new QueryBuilder(
    Product.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }),
    query
  )
    .search(["name", "description", "brand", "category"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await productQuery.modelQuery;
  const meta = await productQuery.countTotal();

  // Get categories for response
  const categories = await Product.distinct("category", {
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });

  return {
    meta,
    data: result,
    categories,
  };
};

// Get single product by ID or slug
const getSingleProductFromDB = async (idOrSlug: string) => {
  const result = await Product.findOne({
    $or: [{ id: idOrSlug }, { slug: idOrSlug }],
    isDeleted: false,
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  return result;
};

// Upload images to Cloudinary
const uploadImagesToCloudinary = async (files: Express.Multer.File[]) => {
  if (!files || files.length === 0) {
    return [];
  }

  const imagePromises = files.map((file) => {
    const imageName = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return sendImageToCloudinary(imageName, file.path);
  });

  const uploadedImages = await Promise.all(imagePromises);

  // Extract secure URLs from Cloudinary response
  return uploadedImages.map((image: any) => image.secure_url || image.url);
};

// Create product
const createProductIntoDB = async (
  payload: TProduct,
  files?: Express.Multer.File[]
) => {
  // Generate ID if not provided
  if (!payload.id) {
    payload.id = `P${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate slug if not provided
  if (!payload.slug && payload.name) {
    payload.slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Upload images if files are provided
  if (files && files.length > 0) {
    const uploadedImages = await uploadImagesToCloudinary(files);
    payload.images = [...(payload.images || []), ...uploadedImages];
  }

  const result = await Product.create(payload);
  return result;
};

// Update product
const updateProductIntoDB = async (
  idOrSlug: string,
  payload: Partial<TProduct>,
  files?: Express.Multer.File[]
) => {
  // Upload new images if files are provided
  if (files && files.length > 0) {
    const uploadedImages = await uploadImagesToCloudinary(files);
    payload.images = [...(payload.images || []), ...uploadedImages];
  }

  const result = await Product.findOneAndUpdate(
    {
      $or: [{ id: idOrSlug }, { slug: idOrSlug }],
      isDeleted: false,
    },
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  return result;
};

// Delete product (soft delete)
const deleteProductFromDB = async (idOrSlug: string) => {
  const result = await Product.findOneAndUpdate(
    {
      $or: [{ id: idOrSlug }, { slug: idOrSlug }],
      isDeleted: false,
    },
    { isDeleted: true },
    {
      new: true,
    }
  );

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  return { ok: true };
};

// Bulk update product order
const updateProductOrder = async (products: TProduct[]) => {
  const bulkOps = products.map((product) => ({
    updateOne: {
      filter: { id: product.id },
      update: { $set: { order: product.order } },
    },
  }));

  await Product.bulkWrite(bulkOps);

  return products;
};

// Search products
const searchProductsFromDB = async (query: Record<string, unknown>) => {
  // Query products where isDeleted is false or doesn't exist (for backward compatibility)
  const productQuery = new QueryBuilder(
    Product.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }),
    query
  )
    .search(["name", "description", "brand", "category", "tags"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await productQuery.modelQuery;
  const meta = await productQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

// Get all brands
const getBrandsFromDB = async () => {
  const brands = await Product.distinct("brand", {
    $and: [
      { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] },
      { brand: { $exists: true, $ne: "" } },
    ],
  });
  return brands.filter(Boolean).sort();
};

// Get all categories with pagination
const getCategoriesFromDB = async (query: Record<string, unknown>) => {
  const categoryQuery = new QueryBuilder(Category.find(), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await categoryQuery.modelQuery;
  const meta = await categoryQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

// Create category
const createCategoryIntoDB = async (payload: any) => {
  const categoryId = `CAT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

  // Generate slug if not provided
  if (!payload.slug && payload.name) {
    payload.slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const category = await Category.create({
    id: categoryId,
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    order: payload.order || 0,
    enabled: payload.enabled ?? true,
  });

  return category;
};

// Update category order (bulk)
const updateCategoryOrder = async (
  categories: Array<{ id: string; order: number }>
) => {
  const bulkOps = categories.map((cat) => ({
    updateOne: {
      filter: { id: cat.id },
      update: { $set: { order: cat.order } },
    },
  }));

  await Category.bulkWrite(bulkOps);
  return categories;
};

// Update category
const updateCategoryIntoDB = async (id: string, payload: any) => {
  // Generate slug if name is updated
  if (payload.name && !payload.slug) {
    payload.slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const category = await Category.findOneAndUpdate(
    { id },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }

  return category;
};

// Delete category
const deleteCategoryFromDB = async (id: string) => {
  const category = await Category.findOneAndDelete({ id });

  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }

  return { ok: true };
};

// Get most loved products
const getMostLovedProductsFromDB = async (limit: number = 10) => {
  // Get products with highest average ratings (using productSlug instead of productId)
  const reviews = await Review.aggregate([
    {
      $group: {
        _id: "$productSlug",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
    { $sort: { avgRating: -1, reviewCount: -1 } },
    { $limit: limit },
  ]);

  const productSlugs = reviews.map((r) => r._id);
  const products = await Product.find({
    slug: { $in: productSlugs },
    isDeleted: false,
  });

  // Sort products by the order from aggregation
  const productMap = new Map(products.map((p) => [p.slug, p]));
  const sortedProducts = productSlugs
    .map((slug) => productMap.get(slug))
    .filter(Boolean);

  return sortedProducts;
};

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

export const ProductServices = {
  getAllProductsFromDB,
  getSingleProductFromDB,
  createProductIntoDB,
  updateProductIntoDB,
  deleteProductFromDB,
  updateProductOrder,
  searchProductsFromDB,
  getBrandsFromDB,
  getCategoriesFromDB,
  createCategoryIntoDB,
  updateCategoryOrder,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
  getMostLovedProductsFromDB,
  // Review functions moved to Review module
};
