import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SimulateServices } from "./simulate.service";

const createDatabase = catchAsync(async (req, res) => {
  const { merchantId } = req.body;
  const result = await SimulateServices.createDatabase(merchantId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Database created successfully",
    data: result,
  });
});

const createDeployment = catchAsync(async (req, res) => {
  const result = await SimulateServices.createDeployment(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Deployment created successfully",
    data: result,
  });
});

const getDeploymentStatus = catchAsync(async (req, res) => {
  const { deploymentId } = req.query;
  const result = await SimulateServices.getDeploymentStatus(
    deploymentId as string
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Deployment status retrieved successfully",
    data: result,
  });
});

export const SimulateControllers = {
  createDatabase,
  createDeployment,
  getDeploymentStatus,
};
