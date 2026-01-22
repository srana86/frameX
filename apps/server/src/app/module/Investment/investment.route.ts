import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { InvestmentControllers } from "./investment.controller";
import { InvestmentValidation } from "./investment.validation";

const router = express.Router();

// Get all investments
router.get(
  "/",
  auth("admin", "tenant", "owner"),
  InvestmentControllers.getAllInvestments
);

// Create investment
router.post(
  "/",
  auth("admin", "tenant", "owner"),
  validateRequest(InvestmentValidation.createInvestmentValidationSchema),
  InvestmentControllers.createInvestment
);

// Update investment
router.put(
  "/:id",
  auth("admin", "tenant", "owner"),
  validateRequest(InvestmentValidation.updateInvestmentValidationSchema),
  InvestmentControllers.updateInvestment
);

// Delete investment
router.delete(
  "/:id",
  auth("admin", "tenant", "owner"),
  InvestmentControllers.deleteInvestment
);

export const InvestmentRoutes = router;
