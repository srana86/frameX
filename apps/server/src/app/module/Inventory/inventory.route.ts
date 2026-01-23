import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { InventoryControllers } from "./inventory.controller";
import { InventoryValidation } from "./inventory.validation";

const router = express.Router();

// Get all inventory transactions
router.get(
  "/",
  auth("admin", "tenant", "owner"),
  InventoryControllers.getAllInventoryTransactions
);

// Get inventory overview
router.get(
  "/overview",
  auth("admin", "tenant", "owner"),
  InventoryControllers.getInventoryOverview
);

// Get all inventory products
router.get(
  "/products",
  auth("admin", "tenant", "owner"),
  InventoryControllers.getAllInventory
);

// Create inventory transaction
router.post(
  "/",
  auth("admin", "tenant", "owner"),
  validateRequest(
    InventoryValidation.createInventoryTransactionValidationSchema
  ),
  InventoryControllers.createInventoryTransaction
);



// Update inventory
router.patch(
  "/:id",
  auth("admin", "tenant", "owner"),
  InventoryControllers.updateInventory
);

export const InventoryRoutes = router;
