import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { InvoiceControllers } from "./invoice.controller";
import {
  createInvoiceValidationSchema,
  updateInvoiceValidationSchema,
  getInvoiceValidationSchema,
  deleteInvoiceValidationSchema,
  sendInvoiceValidationSchema,
} from "./invoice.validation";

const router = express.Router();

router.get("/", InvoiceControllers.getAllInvoices);

router.post(
  "/",
  validateRequest(createInvoiceValidationSchema),
  InvoiceControllers.createInvoice
);

router.get(
  "/:id",
  validateRequest(getInvoiceValidationSchema),
  InvoiceControllers.getInvoiceById
);

router.put(
  "/:id",
  validateRequest(updateInvoiceValidationSchema),
  InvoiceControllers.updateInvoice
);

router.delete(
  "/:id",
  validateRequest(deleteInvoiceValidationSchema),
  InvoiceControllers.deleteInvoice
);

router.post(
  "/:id/send",
  validateRequest(sendInvoiceValidationSchema),
  InvoiceControllers.sendInvoice
);

export const InvoiceRoutes = router;
