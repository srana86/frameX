import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MerchantServices } from "./merchant.service";

const getAllMerchants = catchAsync(async (req, res) => {
  const result = await MerchantServices.getAllMerchants();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Merchants retrieved successfully",
    data: result,
  });
});

const getMerchantById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MerchantServices.getMerchantById(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Merchant not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Merchant retrieved successfully",
    data: result,
  });
});

const createMerchant = catchAsync(async (req, res) => {
  const result = await MerchantServices.createMerchant(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Merchant created successfully",
    data: result,
  });
});

const updateMerchant = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MerchantServices.updateMerchant(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Merchant updated successfully",
    data: result,
  });
});

const getMerchantFull = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MerchantServices.getMerchantFull(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Merchant full data retrieved successfully",
    data: result,
  });
});

const getMerchantSubscription = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MerchantServices.getMerchantSubscription(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Merchant subscription retrieved successfully",
    data: result,
  });
});

const getMerchantDeployment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MerchantServices.getMerchantDeployment(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Merchant deployment retrieved successfully",
    data: result,
  });
});

const getMerchantDatabase = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MerchantServices.getMerchantDatabase(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Merchant database retrieved successfully",
    data: result,
  });
});

const updateMerchantDomain = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { customDomain } = req.body;
  const result = await MerchantServices.updateMerchantDomain(id, customDomain);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Merchant domain updated successfully",
    data: result,
  });
});

const deleteMerchant = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MerchantServices.deleteMerchant(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Merchant deleted successfully",
    data: result,
  });
});

export const MerchantControllers = {
  getAllMerchants,
  getMerchantById,
  getMerchantFull,
  getMerchantSubscription,
  getMerchantDeployment,
  getMerchantDatabase,
  createMerchant,
  updateMerchant,
  updateMerchantDomain,
  deleteMerchant,
};
