import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { BlockedCustomerControllers } from "./blockedCustomer.controller";
import { BlockedCustomerValidation } from "./blockedCustomer.validation";

const router = express.Router();

router.post(
  "/",
  auth("admin", "tenant", "owner"),
  validateRequest(
    BlockedCustomerValidation.createBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.createBlockedCustomer
);

router.get(
  "/",
  auth("admin", "tenant", "owner"),
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
  auth("admin", "tenant", "owner"),
  BlockedCustomerControllers.getSingleBlockedCustomer
);

router.patch(
  "/:id",
  auth("admin", "tenant", "owner"),
  validateRequest(
    BlockedCustomerValidation.updateBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.updateBlockedCustomer
);

router.put(
  "/:id",
  auth("admin", "tenant", "owner"),
  validateRequest(
    BlockedCustomerValidation.updateBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.updateBlockedCustomer
);

router.delete(
  "/:id",
  auth("admin", "tenant", "owner"),
  BlockedCustomerControllers.deleteBlockedCustomer
);

export const BlockedCustomerRoutes = router;
