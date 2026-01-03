import { Schema, model } from "mongoose";
import { TInvestment } from "./investment.interface";

const investmentSchema = new Schema<TInvestment>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Investment = model<TInvestment>("Investment", investmentSchema);
