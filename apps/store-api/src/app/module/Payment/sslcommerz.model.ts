import { Schema, model, models } from "mongoose";
import { TSSLCommerzConfig } from "./sslcommerz.interface";

const sslCommerzConfigSchema = new Schema<TSSLCommerzConfig>(
    {
        id: { type: String, required: true, unique: true },
        enabled: { type: Boolean, default: false },
        storeId: { type: String, required: true },
        storePassword: { type: String, required: true },
        isLive: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

export const SSLCommerzConfig = models.SSLCommerzConfig || model<TSSLCommerzConfig>("SSLCommerzConfig", sslCommerzConfigSchema);
