import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TenantServices } from "./tenant.service";

const getAllTenants = catchAsync(async (req, res) => {
  const result = await TenantServices.getAllTenants();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tenants retrieved successfully",
    data: result,
  });
});

const getTenantById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TenantServices.getTenantById(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Tenant not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tenant retrieved successfully",
    data: result,
  });
});

const createTenant = catchAsync(async (req, res) => {
  const result = await TenantServices.createTenant(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Tenant created successfully",
    data: result,
  });
});

const updateTenant = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TenantServices.updateTenant(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tenant updated successfully",
    data: result,
  });
});

const getTenantFull = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TenantServices.getTenantFull(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tenant full data retrieved successfully",
    data: result,
  });
});

const getTenantSubscription = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TenantServices.getTenantSubscription(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tenant subscription retrieved successfully",
    data: result,
  });
});

const getTenantDeployment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TenantServices.getTenantDeployment(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tenant deployment retrieved successfully",
    data: result,
  });
});

const getTenantDatabase = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TenantServices.getTenantDatabase(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tenant database retrieved successfully",
    data: result,
  });
});

const updateTenantDomain = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { customDomain } = req.body;
  const result = await TenantServices.updateTenantDomain(id, customDomain);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tenant domain updated successfully",
    data: result,
  });
});

const deleteTenant = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TenantServices.deleteTenant(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tenant deleted successfully",
    data: result,
  });
});

// Export with tenant naming
export const TenantControllers = {
  getAllTenants,
  getTenantById,
  getTenantFull,
  getTenantSubscription,
  getTenantDeployment,
  getTenantDatabase,
  createTenant,
  updateTenant,
  updateTenantDomain,
  deleteTenant,
};
