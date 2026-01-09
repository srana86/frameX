import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProductServices } from "./product.service";

// Get all products
const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.getAllProductsFromDB(req.tenantId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Products retrieved successfully",
    meta: result.meta,
    data: {
      products: result.data,
      categories: result.categories,
    },
  });
});

// Get single product
const getSingleProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductServices.getSingleProductFromDB(req.tenantId, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product retrieved successfully",
    data: result,
  });
});

// Create product
const createProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.createProductIntoDB(req.tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Product created successfully",
    data: result,
  });
});

// Update product
const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductServices.updateProductIntoDB(req.tenantId, id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product updated successfully",
    data: result,
  });
});

// Delete product
const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductServices.deleteProductFromDB(req.tenantId, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product deleted successfully",
    data: result,
  });
});

// Update product order (bulk)
const updateProductOrder = catchAsync(async (req: Request, res: Response) => {
  const { products } = req.body;
  const result = await ProductServices.updateProductOrder(req.tenantId, products);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product order updated successfully",
    data: result,
  });
});

// Search products
const searchProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.searchProductsFromDB(req.tenantId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Products retrieved successfully",
    meta: result.meta,
    data: {
      products: result.data,
    },
  });
});

// Get brands
const getBrands = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.getBrandsFromDB(req.tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Brands retrieved successfully",
    data: result,
  });
});

// Get categories
const getCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.getCategoriesFromDB(req.tenantId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Categories retrieved successfully",
    meta: result.meta,
    data: {
      categories: result.data,
    },
  });
});

// Create category
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.createCategoryIntoDB(req.tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

// Update category order (bulk)
const updateCategoryOrder = catchAsync(async (req: Request, res: Response) => {
  const { categories } = req.body;
  const result = await ProductServices.updateCategoryOrder(req.tenantId, categories);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category order updated successfully",
    data: result,
  });
});

// Update category
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductServices.updateCategoryIntoDB(req.tenantId, id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

// Delete category
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await ProductServices.deleteCategoryFromDB(req.tenantId, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category deleted successfully",
    data: null,
  });
});

// Get most loved products
const getMostLovedProducts = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const result = await ProductServices.getMostLovedProductsFromDB(req.tenantId, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Most loved products retrieved successfully",
    data: result,
  });
});

// Get product reviews - using Review module
const getProductReviews = catchAsync(async (req: Request, res: Response) => {
  const { ReviewServices } = await import("../Review/review.service");
  const { id } = req.params;
  const result = await ReviewServices.getProductReviewsFromDB(req.tenantId, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product reviews retrieved successfully",
    data: result,
  });
});

// Create product review - using Review module
const createProductReview = catchAsync(async (req: Request, res: Response) => {
  const { ReviewServices } = await import("../Review/review.service");
  const { id } = req.params;
  const result = await ReviewServices.createProductReviewIntoDB(req.tenantId, id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

export const ProductControllers = {
  getAllProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductOrder,
  searchProducts,
  getBrands,
  getCategories,
  createCategory,
  updateCategoryOrder,
  updateCategory,
  deleteCategory,
  getMostLovedProducts,
  getProductReviews,
  createProductReview,
};
