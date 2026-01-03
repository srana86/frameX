import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DeploymentServices } from "./deployment.service";

const getAllDeployments = catchAsync(async (req, res) => {
  const result = await DeploymentServices.getAllDeployments();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Deployments retrieved successfully",
    data: result,
  });
});

const fixProjectId = catchAsync(async (req, res) => {
  const { deploymentId, projectId } = req.body;
  const result = await DeploymentServices.fixProjectId(deploymentId, projectId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project ID updated successfully",
    data: result,
  });
});

export const DeploymentControllers = {
  getAllDeployments,
  fixProjectId,
};
