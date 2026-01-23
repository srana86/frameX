import express from "express";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { CustomerControllers } from "./customer.controller";

const router = express.Router();

// Get all customers with statistics (admin/tenant only)
// tenantMiddleware MUST come before auth
router.get(
  "/",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  CustomerControllers.getAllCustomers
);

// Update customer (admin/tenant only)
router.patch(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  CustomerControllers.updateCustomer
);

router.put(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  CustomerControllers.updateCustomer
);

export const CustomerRoutes = router;
