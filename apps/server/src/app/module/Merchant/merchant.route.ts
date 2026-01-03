import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { MerchantControllers } from "./merchant.controller";
import {
  createMerchantValidationSchema,
  updateMerchantValidationSchema,
  getMerchantValidationSchema,
  deleteMerchantValidationSchema,
} from "./merchant.validation";

const router = express.Router();

router.get("/", MerchantControllers.getAllMerchants);

router.post(
  "/",
  validateRequest(createMerchantValidationSchema),
  MerchantControllers.createMerchant
);

router.get(
  "/:id",
  validateRequest(getMerchantValidationSchema),
  MerchantControllers.getMerchantById
);

router.put(
  "/:id",
  validateRequest(updateMerchantValidationSchema),
  MerchantControllers.updateMerchant
);

router.get(
  "/:id/full",
  validateRequest(getMerchantValidationSchema),
  MerchantControllers.getMerchantFull
);

router.get(
  "/:id/subscription",
  validateRequest(getMerchantValidationSchema),
  MerchantControllers.getMerchantSubscription
);

router.get(
  "/:id/deployment",
  validateRequest(getMerchantValidationSchema),
  MerchantControllers.getMerchantDeployment
);

router.get(
  "/:id/database",
  validateRequest(getMerchantValidationSchema),
  MerchantControllers.getMerchantDatabase
);

router.put(
  "/:id/domain",
  validateRequest(updateMerchantValidationSchema),
  MerchantControllers.updateMerchantDomain
);

router.delete(
  "/:id",
  validateRequest(deleteMerchantValidationSchema),
  MerchantControllers.deleteMerchant
);

export const MerchantRoutes = router;
