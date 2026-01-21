import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { BudgetControllers } from "./budget.controller";
import { BudgetValidation } from "./budget.validation";

const router = express.Router();

// Get all budgets
router.get("/", auth("admin", "tenant"), BudgetControllers.getAllBudgets);

// Create budget
router.post(
  "/",
  auth("admin", "tenant"),
  validateRequest(BudgetValidation.createBudgetValidationSchema),
  BudgetControllers.createBudget
);

// Update budget
router.put(
  "/:id",
  auth("admin", "tenant"),
  validateRequest(BudgetValidation.updateBudgetValidationSchema),
  BudgetControllers.updateBudget
);

// Delete budget
router.delete(
  "/:id",
  auth("admin", "tenant"),
  BudgetControllers.deleteBudget
);

export const BudgetRoutes = router;
