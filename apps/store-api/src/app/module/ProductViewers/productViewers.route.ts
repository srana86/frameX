import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { ProductViewersControllers } from "./productViewers.controller";
import { ProductViewersValidation } from "./productViewers.validation";

const router = express.Router();

// Track product viewer (public)
router.post(
  "/",
  validateRequest(ProductViewersValidation.trackProductViewerValidationSchema),
  ProductViewersControllers.trackProductViewer
);

// Get viewer count (public)
router.get("/", ProductViewersControllers.getProductViewerCount);

// Remove viewer (public)
router.delete(
  "/",
  validateRequest(ProductViewersValidation.removeProductViewerValidationSchema),
  ProductViewersControllers.removeProductViewer
);

export const ProductViewersRoutes = router;
