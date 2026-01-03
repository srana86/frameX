import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SettingsServices } from "./settings.service";

const getGeneralSettings = catchAsync(async (req, res) => {
  const result = await SettingsServices.getGeneralSettings();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "General settings retrieved successfully",
    data: result,
  });
});

const updateGeneralSettings = catchAsync(async (req, res) => {
  const result = await SettingsServices.updateGeneralSettings(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "General settings updated successfully",
    data: result,
  });
});

const getSSLCommerzSettings = catchAsync(async (req, res) => {
  const result = await SettingsServices.getSSLCommerzSettings();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SSLCommerz settings retrieved successfully",
    data: result,
  });
});

const updateSSLCommerzSettings = catchAsync(async (req, res) => {
  const result = await SettingsServices.updateSSLCommerzSettings(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SSLCommerz settings updated successfully",
    data: result,
  });
});

const testSSLCommerzConnection = catchAsync(async (req, res) => {
  const result = await SettingsServices.testSSLCommerzConnection(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: result.success,
    message: result.message,
    data: result.details,
  });
});

export const SettingsControllers = {
  getGeneralSettings,
  updateGeneralSettings,
  getSSLCommerzSettings,
  updateSSLCommerzSettings,
  testSSLCommerzConnection,
};
