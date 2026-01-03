import { z } from "zod";

// Create inventory transaction validation schema
const createInventoryTransactionValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    productId: z.string({ required_error: "Product ID is required" }),
    type: z.enum(["order", "restock", "adjustment", "return"], {
      required_error: "Transaction type is required",
    }),
    quantity: z.number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be number",
    }),
    orderId: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const InventoryValidation = {
  createInventoryTransactionValidationSchema,
};
