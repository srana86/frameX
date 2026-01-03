import { Schema, model } from "mongoose";
import {
  IDeployment,
  DeploymentType,
  DeploymentStatus,
  DeploymentProvider,
} from "./deployment.interface";

const deploymentSchema = new Schema<IDeployment>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    merchantId: {
      type: String,
      required: true,
    },
    deploymentType: {
      type: String,
      enum: ["subdomain", "custom_domain", "local"],
      required: true,
    },
    subdomain: String,
    deploymentStatus: {
      type: String,
      enum: ["pending", "active", "failed", "inactive"],
      default: "pending",
    },
    deploymentUrl: {
      type: String,
      required: true,
    },
    deploymentProvider: {
      type: String,
      enum: ["vercel", "local", "other"],
    },
    projectId: String,
    deploymentId: String,
    environmentVariables: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastDeployedAt: String,
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

deploymentSchema.index({ merchantId: 1 });
deploymentSchema.index({ deploymentStatus: 1 });
deploymentSchema.index({ createdAt: -1 });

export const Deployment = model<IDeployment>(
  "merchant_deployments",
  deploymentSchema
);
