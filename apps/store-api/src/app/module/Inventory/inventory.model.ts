import { Schema, model } from "mongoose";
import { TInventoryTransaction } from "./inventory.interface";

const inventoryTransactionSchema = new Schema<TInventoryTransaction>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    productId: {
      type: String,
      required: true,
      index: true,
    },
    productName: String,
    type: {
      type: String,
      enum: ["order", "restock", "adjustment", "return"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    orderId: String,
    notes: String,
  },
  {
    timestamps: true,
    collection: "inventory_transactions",
  }
);

export const InventoryTransaction = model<TInventoryTransaction>(
  "InventoryTransaction",
  inventoryTransactionSchema
);
