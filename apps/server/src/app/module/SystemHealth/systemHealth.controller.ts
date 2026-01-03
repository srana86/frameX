import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SystemHealthServices } from "./systemHealth.service";

const getSystemHealth = catchAsync(async (req, res) => {
  const result = await SystemHealthServices.getSystemHealth();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "System health check completed",
    data: result,
  });
});

export const SystemHealthControllers = {
  getSystemHealth,
};
