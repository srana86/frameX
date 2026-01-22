import { z } from "zod";

// Create inventory transaction validation schema
const createInventoryTransactionValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    productId: z.string({ message: "Product ID is required" }),
    type: z.enum(["order", "restock", "adjustment", "return"], {
      message: "Transaction type is required",
    }),
    quantity: z.number({ message: "Quantity is required" }),
    orderId: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const InventoryValidation = {
  createInventoryTransactionValidationSchema,
};
