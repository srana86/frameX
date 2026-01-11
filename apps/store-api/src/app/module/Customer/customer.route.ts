import express from "express";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { CustomerControllers } from "./customer.controller";

const router = express.Router();

// Get all customers with statistics (admin/merchant only)
// tenantMiddleware MUST come before auth
router.get(
  "/",
  tenantMiddleware,
  auth("admin", "merchant"),
  CustomerControllers.getAllCustomers
);

export const CustomerRoutes = router;
