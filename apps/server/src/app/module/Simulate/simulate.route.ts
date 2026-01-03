import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { SimulateControllers } from "./simulate.controller";
import {
  createDatabaseValidationSchema,
  createDeploymentValidationSchema,
  getDeploymentStatusValidationSchema,
} from "./simulate.validation";

const router = express.Router();

// Note: These routes should be protected in production (dev only)
router.post(
  "/create-database",
  validateRequest(createDatabaseValidationSchema),
  SimulateControllers.createDatabase
);

router.post(
  "/create-deployment",
  validateRequest(createDeploymentValidationSchema),
  SimulateControllers.createDeployment
);

router.get(
  "/deployment-status",
  validateRequest(getDeploymentStatusValidationSchema),
  SimulateControllers.getDeploymentStatus
);

export const SimulateRoutes = router;
