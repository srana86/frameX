import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { tenantMiddleware } from "../../middlewares/tenant";
import { ProductViewersControllers } from "./productViewers.controller";
import { ProductViewersValidation } from "./productViewers.validation";

const router = express.Router();

// Track product viewer (public)
router.post(
  "/",
  tenantMiddleware,
  validateRequest(ProductViewersValidation.trackProductViewerValidationSchema),
  ProductViewersControllers.trackProductViewer
);

// Get viewer count (public)
router.get("/", tenantMiddleware, ProductViewersControllers.getProductViewerCount);

// Remove viewer (public)
router.delete(
  "/",
  tenantMiddleware,
  validateRequest(ProductViewersValidation.removeProductViewerValidationSchema),
  ProductViewersControllers.removeProductViewer
);

export const ProductViewersRoutes = router;
