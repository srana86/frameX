import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { upload } from "../../utils/sendImageToCloudinary";
import { ProductControllers } from "./product.controller";
import { ProductValidation } from "./product.validation";
import { ReviewValidation } from "../Review/review.validation";

const router = express.Router();

// =====================
// Public routes (tenant context required, no auth)
// =====================
router.get("/", tenantMiddleware, ProductControllers.getAllProducts);
router.get("/brands", tenantMiddleware, ProductControllers.getBrands);
router.get("/categories", tenantMiddleware, ProductControllers.getCategories);
router.get(
  "/most-loved",
  tenantMiddleware,
  ProductControllers.getMostLovedProducts
);
router.get("/search", tenantMiddleware, ProductControllers.searchProducts);
router.get("/:id", tenantMiddleware, ProductControllers.getSingleProduct);

// Review routes - public with tenant context
router.get(
  "/:id/reviews",
  tenantMiddleware,
  ProductControllers.getProductReviews
);
router.post(
  "/:id/reviews",
  tenantMiddleware,
  validateRequest(ReviewValidation.createReviewValidationSchema),
  ProductControllers.createProductReview
);

// =====================
// Protected routes (tenant + auth required)
// tenantMiddleware MUST come before auth
// =====================

// Product category routes
router.post(
  "/categories",
  tenantMiddleware,
  auth("admin", "tenant"),
  validateRequest(ProductValidation.createCategoryValidationSchema),
  ProductControllers.createCategory
);
router.put(
  "/categories",
  tenantMiddleware,
  auth("admin", "tenant"),
  validateRequest(ProductValidation.updateCategoryOrderValidationSchema),
  ProductControllers.updateCategoryOrder
);
router.put(
  "/categories/:id",
  tenantMiddleware,
  auth("admin", "tenant"),
  validateRequest(ProductValidation.updateCategoryValidationSchema),
  ProductControllers.updateCategory
);
router.delete(
  "/categories/:id",
  tenantMiddleware,
  auth("admin", "tenant"),
  ProductControllers.deleteCategory
);

// Product CRUD routes
router.post(
  "/",
  tenantMiddleware,
  auth("admin", "tenant"),
  upload.array("images", 20),
  validateRequest(ProductValidation.createProductValidationSchema),
  ProductControllers.createProduct
);
router.put(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant"),
  upload.array("images", 20),
  validateRequest(ProductValidation.updateProductValidationSchema),
  ProductControllers.updateProduct
);
router.delete(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant"),
  ProductControllers.deleteProduct
);
router.put(
  "/:id/order",
  tenantMiddleware,
  auth("admin", "tenant"),
  validateRequest(ProductValidation.updateProductOrderValidationSchema),
  ProductControllers.updateProductOrder
);

export const ProductRoutes = router;
