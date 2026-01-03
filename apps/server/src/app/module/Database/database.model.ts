import { Schema, model } from "mongoose";
import { IDatabase } from "./database.interface";

const databaseSchema = new Schema<IDatabase>(
  {
    id: {
      type: String,
    },
    merchantId: {
      type: String,
      required: true,
    },
    databaseName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "active",
    },
    useSharedDatabase: {
      type: Boolean,
      default: false,
    },
    sizeOnDisk: Number,
    connectionString: String,
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: function (doc, ret) {
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

databaseSchema.index({ merchantId: 1 });
databaseSchema.index({ databaseName: 1 });

export const Database = model<IDatabase>("merchant_databases", databaseSchema);
