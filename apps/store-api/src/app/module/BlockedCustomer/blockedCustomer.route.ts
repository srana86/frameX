import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { BlockedCustomerControllers } from "./blockedCustomer.controller";
import { BlockedCustomerValidation } from "./blockedCustomer.validation";

const router = express.Router();

router.post(
  "/",
  auth("admin", "tenant"),
  validateRequest(
    BlockedCustomerValidation.createBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.createBlockedCustomer
);

router.get(
  "/",
  auth("admin", "tenant"),
  BlockedCustomerControllers.getAllBlockedCustomers
);

router.post(
  "/check",
  validateRequest(
    BlockedCustomerValidation.checkBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.checkBlockedCustomer
);

router.get(
  "/:id",
  auth("admin", "tenant"),
  BlockedCustomerControllers.getSingleBlockedCustomer
);

router.put(
  "/:id",
  auth("admin", "tenant"),
  validateRequest(
    BlockedCustomerValidation.updateBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.updateBlockedCustomer
);

router.delete(
  "/:id",
  auth("admin", "tenant"),
  BlockedCustomerControllers.deleteBlockedCustomer
);

export const BlockedCustomerRoutes = router;
