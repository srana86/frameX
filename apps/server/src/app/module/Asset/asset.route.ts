import express from "express";
import { AssetControllers } from "./asset.controller";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";


const router = express.Router();

// All routes require authentication
router.use(tenantMiddleware);
router.use(auth("tenant", "admin"));

// Get all assets for tenant
router.get("/", AssetControllers.getAssets);

// Get orphaned assets
router.get("/orphaned", AssetControllers.getOrphanedAssets);

// Cleanup orphaned assets
router.post("/cleanup", AssetControllers.cleanupOrphanedAssets);

// Delete specific asset
router.delete("/:assetId", AssetControllers.deleteAsset);

export const AssetRoutes = router;
