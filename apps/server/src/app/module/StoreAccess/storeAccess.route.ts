import express from "express";
import auth from "../../middlewares/auth";
import { StoreAccessControllers } from "./storeAccess.controller";

const router = express.Router();

// Get all stores current user has access to (requires authentication)
// Endpoint: GET /api/v1/store-access/my-stores
// NOTE: Must be defined before /:storeId to avoid matching "my-stores" as storeId
router.get(
  "/my-stores",
  auth(),
  StoreAccessControllers.getUserStores
);

// Verify store access for current user (requires authentication)
// Endpoint: GET /api/v1/store-access/:storeId
router.get(
  "/:storeId",
  auth(),
  StoreAccessControllers.verifyStoreAccess
);

export const StoreAccessRoutes = router;
