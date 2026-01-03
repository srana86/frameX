import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import auth from "../../../middlewares/auth";
import { PageControllers } from "./page.controller";
import { PageValidation } from "./page.validation";

const router = express.Router();

// Get all pages
router.get("/", auth("admin", "merchant"), PageControllers.getAllPages);

// Get enabled pages (public)
router.get("/enabled", PageControllers.getEnabledPages);

// Get page by slug
router.get("/:slug", PageControllers.getPageBySlug);

// Create page
router.post(
  "/",
  auth("admin", "merchant"),
  validateRequest(PageValidation.createPageValidationSchema),
  PageControllers.createPage
);

// Update page
router.put(
  "/:slug",
  auth("admin", "merchant"),
  validateRequest(PageValidation.updatePageValidationSchema),
  PageControllers.updatePage
);

// Delete page
router.delete("/:slug", auth("admin", "merchant"), PageControllers.deletePage);

// Get page categories
router.get("/categories", PageControllers.getPageCategories);

// Create page category
router.post(
  "/categories",
  auth("admin", "merchant"),
  validateRequest(PageValidation.createPageCategoryValidationSchema),
  PageControllers.createPageCategory
);

// Update page category
router.put(
  "/categories/:id",
  auth("admin", "merchant"),
  validateRequest(PageValidation.updatePageCategoryValidationSchema),
  PageControllers.updatePageCategory
);

// Delete page category
router.delete(
  "/categories/:id",
  auth("admin", "merchant"),
  PageControllers.deletePageCategory
);

export const PageRoutes = router;
