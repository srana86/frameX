import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { FraudCheckServices } from "./fraudCheck.service";
import config from "../../../config/index";

const getFraudCheckStats = catchAsync(async (req, res) => {
  const apiKey =
    (req.headers["x-fraudshield-api-key"] as string) ||
    config.fraudshield_api_key;

  if (!apiKey) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message:
        "FraudShield API key is not set. Please configure it in environment variables.",
      data: {
        success: false,
        error: "API key not configured",
      },
    });
  }

  try {
    const result = await FraudCheckServices.getFraudCheckStats(apiKey);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Fraud check stats retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    const errorMessage =
      error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED"
        ? "Unable to connect to FraudShield API"
        : "Failed to fetch usage statistics";

    sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: errorMessage,
      data: {
        success: false,
        error: "Server error",
        message: errorMessage,
      },
    });
  }
});

const checkCustomerFraud = catchAsync(async (req, res) => {
  const { phone, action, page, limit, risk_level } = req.body;
  const apiKey =
    (req.headers["x-fraudshield-api-key"] as string) ||
    config.fraudshield_api_key;

  if (!apiKey) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message:
        "FraudShield API key is not set. Please configure it in environment variables.",
      data: {
        success: false,
        error: "API key not configured",
      },
    });
  }

  try {
    const result = await FraudCheckServices.checkCustomerFraud(
      phone,
      action,
      page,
      limit,
      risk_level,
      apiKey
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Fraud check completed successfully",
      data: result,
    });
  } catch (error: any) {
    const errorMessage =
      error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED"
        ? "Unable to connect to FraudShield API"
        : error.message || "Failed to check customer data";

    sendResponse(res, {
      statusCode: error.message?.includes("Invalid")
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: errorMessage,
      data: {
        success: false,
        error: "Server error",
        message: errorMessage,
      },
    });
  }
});

// Get fraud check settings
const getFraudCheckSettings = catchAsync(async (req, res) => {
  const tenantId = req.tenantId || (req.user as any)?.tenantId || req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Tenant ID is required",
      data: null,
    });
  }

  const result = await FraudCheckServices.getFraudCheckSettingsFromDB(tenantId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fraud check settings retrieved successfully",
    data: result,
  });
});

// Update fraud check settings
const updateFraudCheckSettings = catchAsync(async (req, res) => {
  const tenantId = req.tenantId || (req.user as any)?.tenantId || req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Tenant ID is required",
      data: null,
    });
  }

  const result = await FraudCheckServices.updateFraudCheckSettingsIntoDB(
    tenantId,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fraud check settings updated successfully",
    data: result,
  });
});

export const FraudCheckControllers = {
  getFraudCheckStats,
  checkCustomerFraud,
  getFraudCheckSettings,
  updateFraudCheckSettings,
};
