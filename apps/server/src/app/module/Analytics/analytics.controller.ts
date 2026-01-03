import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AnalyticsServices } from "./analytics.service";

const getAnalytics = catchAsync(async (req, res) => {
  const result = await AnalyticsServices.getAnalytics();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Analytics retrieved successfully",
    data: result,
  });
});

export const AnalyticsControllers = {
  getAnalytics,
};
