import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { upload } from "../../utils/sendImageToCloudinary";
import { ProductControllers } from "./product.controller";
import { ProductValidation } from "./product.validation";
import { ReviewValidation } from "../Review/review.validation";

const router = express.Router();

// Product routes (public but need tenant context)
router.get("/", tenantMiddleware, ProductControllers.getAllProducts);
router.get("/brands", tenantMiddleware, ProductControllers.getBrands);
router.get("/categories", tenantMiddleware, ProductControllers.getCategories);
router.get("/most-loved", tenantMiddleware, ProductControllers.getMostLovedProducts);
router.get("/search", tenantMiddleware, ProductControllers.searchProducts);
router.get("/:id", tenantMiddleware, ProductControllers.getSingleProduct);

// Product category routes
router.post(
  "/categories",
  auth("admin", "merchant"),
  validateRequest(ProductValidation.createCategoryValidationSchema),
  ProductControllers.createCategory
);
router.put(
  "/categories",
  auth("admin", "merchant"),
  validateRequest(ProductValidation.updateCategoryOrderValidationSchema),
  ProductControllers.updateCategoryOrder
);
router.put(
  "/categories/:id",
  auth("admin", "merchant"),
  validateRequest(ProductValidation.updateCategoryValidationSchema),
  ProductControllers.updateCategory
);
router.delete(
  "/categories/:id",
  auth("admin", "merchant"),
  ProductControllers.deleteCategory
);

// Review routes - using Review module
router.get("/:id/reviews", ProductControllers.getProductReviews);
router.post(
  "/:id/reviews",
  validateRequest(ReviewValidation.createReviewValidationSchema),
  ProductControllers.createProductReview
);

// Product CRUD routes
router.post(
  "/",
  auth("admin", "merchant"),
  upload.array("images", 20),
  validateRequest(ProductValidation.createProductValidationSchema),
  ProductControllers.createProduct
);
router.put(
  "/:id",
  auth("admin", "merchant"),
  upload.array("images", 20),
  validateRequest(ProductValidation.updateProductValidationSchema),
  ProductControllers.updateProduct
);
router.delete(
  "/:id",
  auth("admin", "merchant"),
  ProductControllers.deleteProduct
);
router.put(
  "/:id/order",
  auth("admin", "merchant"),
  validateRequest(ProductValidation.updateProductOrderValidationSchema),
  ProductControllers.updateProductOrder
);

export const ProductRoutes = router;
