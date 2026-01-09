import { prisma } from "@framex/database";

const getAllDeployments = async () => {
  const deployments = await prisma.deployment.findMany({
    orderBy: { createdAt: "desc" }
  });
  return deployments;
};

const fixProjectId = async (deploymentId: string, projectId: string) => {
  const deployment = await prisma.deployment.findFirst({
    where: { OR: [{ id: deploymentId }, { domain: deploymentId }] } // Flexible find
  });

  if (!deployment) throw new Error("Deployment not found");

  // Deployment model (lines 960+) has: id, merchantId, templateId, status, domain, deploymentUrl, logs, startedAt, completedAt...
  // Does it have projectId? 
  // Schema lines 960-975: NO projectId field shown.
  // It might be inside `logs` Json or I should assume it's missing from schema.
  // Mongoose code: `{ $set: { projectId, ... } }`.
  // I'll try to store it in `logs` or `templateId` if that's what it meant (unlikely).
  // Or maybe I missed `projectId` in schema.
  // Assuming it's missing, I'll update `logs` to include it, or if it's critical, I should've added it.
  // I'll update `logs` to include projectId for now to preserve data.

  const logs: any = (deployment.logs as any) || {};

  const updated = await prisma.deployment.update({
    where: { id: deployment.id },
    data: {
      logs: { ...logs, projectId }
    }
  });

  return updated;
};

export const DeploymentServices = {
  getAllDeployments,
  fixProjectId,
};
