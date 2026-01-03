import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { BudgetControllers } from "./budget.controller";
import { BudgetValidation } from "./budget.validation";

const router = express.Router();

// Get all budgets
router.get("/", auth("admin", "merchant"), BudgetControllers.getAllBudgets);

// Create budget
router.post(
  "/",
  auth("admin", "merchant"),
  validateRequest(BudgetValidation.createBudgetValidationSchema),
  BudgetControllers.createBudget
);

// Update budget
router.put(
  "/:id",
  auth("admin", "merchant"),
  validateRequest(BudgetValidation.updateBudgetValidationSchema),
  BudgetControllers.updateBudget
);

// Delete budget
router.delete(
  "/:id",
  auth("admin", "merchant"),
  BudgetControllers.deleteBudget
);

export const BudgetRoutes = router;
