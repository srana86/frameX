import { Deployment } from "./deployment.model";
import { toPlainObjectArray, toPlainObject } from "../../utils/mongodb";
import { IDeployment } from "./deployment.interface";

const getAllDeployments = async () => {
  const deployments = await Deployment.find({}).sort({ createdAt: -1 });
  return toPlainObjectArray<IDeployment>(deployments);
};

const fixProjectId = async (deploymentId: string, projectId: string) => {
  const deployment = await Deployment.findOneAndUpdate(
    { id: deploymentId },
    { $set: { projectId, updatedAt: new Date().toISOString() } },
    { new: true }
  );

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  return toPlainObject<IDeployment>(deployment);
};

export const DeploymentServices = {
  getAllDeployments,
  fixProjectId,
};
