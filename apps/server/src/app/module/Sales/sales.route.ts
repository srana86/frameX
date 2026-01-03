import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { SalesControllers } from "./sales.controller";
import { createSaleValidationSchema } from "./sales.validation";

const router = express.Router();

router.get("/", SalesControllers.getAllSales);

router.post(
  "/",
  validateRequest(createSaleValidationSchema),
  SalesControllers.createSale
);

export const SalesRoutes = router;
