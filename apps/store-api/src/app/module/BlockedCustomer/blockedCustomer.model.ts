import { Schema, model } from "mongoose";
import { TBlockedCustomer } from "./blockedCustomer.interface";

const blockedCustomerSchema = new Schema<TBlockedCustomer>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      sparse: true,
      index: true,
    },
    email: {
      type: String,
      sparse: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    notes: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    blockedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: true,
    collection: "blocked_customers",
  }
);

export const BlockedCustomer = model<TBlockedCustomer>(
  "BlockedCustomer",
  blockedCustomerSchema
);
