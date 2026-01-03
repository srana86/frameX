import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { BlockedCustomerControllers } from "./blockedCustomer.controller";
import { BlockedCustomerValidation } from "./blockedCustomer.validation";

const router = express.Router();

router.post(
  "/",
  auth("admin", "merchant"),
  validateRequest(
    BlockedCustomerValidation.createBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.createBlockedCustomer
);

router.get(
  "/",
  auth("admin", "merchant"),
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
  auth("admin", "merchant"),
  BlockedCustomerControllers.getSingleBlockedCustomer
);

router.put(
  "/:id",
  auth("admin", "merchant"),
  validateRequest(
    BlockedCustomerValidation.updateBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.updateBlockedCustomer
);

router.delete(
  "/:id",
  auth("admin", "merchant"),
  BlockedCustomerControllers.deleteBlockedCustomer
);

export const BlockedCustomerRoutes = router;
