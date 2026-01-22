import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { InventoryControllers } from "./inventory.controller";
import { InventoryValidation } from "./inventory.validation";

const router = express.Router();

// Get all inventory transactions
router.get(
  "/",
  auth("admin", "tenant"),
  InventoryControllers.getAllInventoryTransactions
);

// Get inventory overview
router.get(
  "/overview",
  auth("admin", "tenant"),
  InventoryControllers.getInventoryOverview
);

// Create inventory transaction
router.post(
  "/",
  auth("admin", "tenant"),
  validateRequest(
    InventoryValidation.createInventoryTransactionValidationSchema
  ),
  InventoryControllers.createInventoryTransaction
);

export const InventoryRoutes = router;
