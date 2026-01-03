import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { DeploymentControllers } from "./deployment.controller";
import { fixProjectIdValidationSchema } from "./deployment.validation";

const router = express.Router();

router.get("/", DeploymentControllers.getAllDeployments);

router.post(
  "/fix-project-id",
  validateRequest(fixProjectIdValidationSchema),
  DeploymentControllers.fixProjectId
);

export const DeploymentRoutes = router;
