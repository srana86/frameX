import { Schema, model } from "mongoose";
import { TBudget } from "./budget.interface";

const budgetSchema = new Schema<TBudget>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    period: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
    },
    endDate: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Budget = model<TBudget>("Budget", budgetSchema);
