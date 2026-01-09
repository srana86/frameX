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
