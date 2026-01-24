import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { BlockedCustomerControllers } from "./blockedCustomer.controller";
import { BlockedCustomerValidation } from "./blockedCustomer.validation";
import { tenantMiddleware } from "../../middlewares/tenant";

const router = express.Router();

router.post(
  "/",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  validateRequest(
    BlockedCustomerValidation.createBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.createBlockedCustomer
);

router.get(
  "/",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  BlockedCustomerControllers.getAllBlockedCustomers
);

router.post(
  "/check",
  tenantMiddleware,
  validateRequest(
    BlockedCustomerValidation.checkBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.checkBlockedCustomer
);

router.get(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  BlockedCustomerControllers.getSingleBlockedCustomer
);

router.patch(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  validateRequest(
    BlockedCustomerValidation.updateBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.updateBlockedCustomer
);

router.put(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  validateRequest(
    BlockedCustomerValidation.updateBlockedCustomerValidationSchema
  ),
  BlockedCustomerControllers.updateBlockedCustomer
);

router.delete(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  BlockedCustomerControllers.deleteBlockedCustomer
);

export const BlockedCustomerRoutes = router;
