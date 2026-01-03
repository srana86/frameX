import express from "express";
import auth from "../../middlewares/auth";
import { CustomerControllers } from "./customer.controller";

const router = express.Router();

// Get all customers with statistics
router.get("/", auth("admin", "merchant"), CustomerControllers.getAllCustomers);

export const CustomerRoutes = router;
