import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { FeatureRequestServices } from "./featureRequest.service";

const getAllFeatureRequests = catchAsync(async (req, res) => {
  const status = req.query.status as string;
  const merchantId = req.query.merchantId as string;
  const result = await FeatureRequestServices.getAllFeatureRequests(
    status,
    merchantId
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Feature requests retrieved successfully",
    data: result.data,
  });
});

const getFeatureRequestById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureRequestServices.getFeatureRequestById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Feature request retrieved successfully",
    data: result,
  });
});

const createFeatureRequest = catchAsync(async (req, res) => {
  const result = await FeatureRequestServices.createFeatureRequest(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Feature request created successfully",
    data: result.data,
  });
});

const updateFeatureRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureRequestServices.updateFeatureRequest(
    id,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Feature request updated successfully",
    data: result.data,
  });
});

const deleteFeatureRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureRequestServices.deleteFeatureRequest(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Feature request deleted successfully",
    data: result,
  });
});

export const FeatureRequestControllers = {
  getAllFeatureRequests,
  getFeatureRequestById,
  createFeatureRequest,
  updateFeatureRequest,
  deleteFeatureRequest,
};
