import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import auth from "../../../middlewares/auth";
import { PageControllers } from "./page.controller";
import { PageValidation } from "./page.validation";

const router = express.Router();

// Get all pages
router.get("/", auth("admin", "tenant", "owner"), PageControllers.getAllPages);

// Get enabled pages (public)
router.get("/enabled", PageControllers.getEnabledPages);

// Get page by slug
router.get("/:slug", PageControllers.getPageBySlug);

// Create page
router.post(
  "/",
  auth("admin", "tenant", "owner"),
  validateRequest(PageValidation.createPageValidationSchema),
  PageControllers.createPage
);

// Update page
router.patch(
  "/:slug",
  auth("admin", "tenant", "owner"),
  validateRequest(PageValidation.updatePageValidationSchema),
  PageControllers.updatePage
);

router.put(
  "/:slug",
  auth("admin", "tenant", "owner"),
  validateRequest(PageValidation.updatePageValidationSchema),
  PageControllers.updatePage
);

// Delete page
router.delete("/:slug", auth("admin", "tenant", "owner"), PageControllers.deletePage);

// Get page categories
router.get("/categories", PageControllers.getPageCategories);

// Create page category
router.post(
  "/categories",
  auth("admin", "tenant", "owner"),
  validateRequest(PageValidation.createPageCategoryValidationSchema),
  PageControllers.createPageCategory
);

// Update page category
router.patch(
  "/categories/:id",
  auth("admin", "tenant", "owner"),
  validateRequest(PageValidation.updatePageCategoryValidationSchema),
  PageControllers.updatePageCategory
);

router.put(
  "/categories/:id",
  auth("admin", "tenant", "owner"),
  validateRequest(PageValidation.updatePageCategoryValidationSchema),
  PageControllers.updatePageCategory
);

// Delete page category
router.delete(
  "/categories/:id",
  auth("admin", "tenant", "owner"),
  PageControllers.deletePageCategory
);

export const PageRoutes = router;
