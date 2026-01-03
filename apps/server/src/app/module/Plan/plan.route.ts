import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { PlanControllers } from "./plan.controller";
import {
  createPlanValidationSchema,
  updatePlanValidationSchema,
  getPlanValidationSchema,
  deletePlanValidationSchema,
} from "./plan.validation";

const router = express.Router();

router.get("/", PlanControllers.getAllPlans);

router.post(
  "/",
  validateRequest(createPlanValidationSchema),
  PlanControllers.createPlan
);

router.post("/seed", PlanControllers.seedPlans);

router.get(
  "/:id",
  validateRequest(getPlanValidationSchema),
  PlanControllers.getPlanById
);

router.put(
  "/:id",
  validateRequest(updatePlanValidationSchema),
  PlanControllers.updatePlan
);

router.delete(
  "/:id",
  validateRequest(deletePlanValidationSchema),
  PlanControllers.deletePlan
);

export const PlanRoutes = router;
