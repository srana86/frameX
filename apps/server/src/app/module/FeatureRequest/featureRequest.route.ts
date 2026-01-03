import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { FeatureRequestControllers } from "./featureRequest.controller";
import {
  createFeatureRequestValidationSchema,
  updateFeatureRequestValidationSchema,
  getFeatureRequestValidationSchema,
  deleteFeatureRequestValidationSchema,
} from "./featureRequest.validation";

const router = express.Router();

router.get("/", FeatureRequestControllers.getAllFeatureRequests);

router.post(
  "/",
  validateRequest(createFeatureRequestValidationSchema),
  FeatureRequestControllers.createFeatureRequest
);

router.get(
  "/:id",
  validateRequest(getFeatureRequestValidationSchema),
  FeatureRequestControllers.getFeatureRequestById
);

router.put(
  "/:id",
  validateRequest(updateFeatureRequestValidationSchema),
  FeatureRequestControllers.updateFeatureRequest
);

router.delete(
  "/:id",
  validateRequest(deleteFeatureRequestValidationSchema),
  FeatureRequestControllers.deleteFeatureRequest
);

export const FeatureRequestRoutes = router;
