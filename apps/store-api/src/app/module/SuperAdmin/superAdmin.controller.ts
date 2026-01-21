import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SuperAdminServices } from "./superAdmin.service";

// Get all tenants
const getAllTenants = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminServices.getAllTenantsFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tenants retrieved successfully",
    data: {
      tenants: result,
    },
  });
});

// Create new tenant
const createTenant = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminServices.createTenantFromDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Tenant created successfully",
    data: result,
  });
});

// Update tenant
const updateTenant = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminServices.updateTenantFromDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tenant updated successfully",
    data: result,
  });
});

// Get full tenant data
const getFullTenantData = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SuperAdminServices.getFullTenantDataFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Full tenant data retrieved successfully",
    data: result,
  });
});

// Get tenant database
const getTenantDatabase = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SuperAdminServices.getTenantDatabaseFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tenant database information retrieved successfully",
    data: result,
  });
});

// Get tenant deployment
const getTenantDeployment = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await SuperAdminServices.getTenantDeploymentFromDB(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tenant deployment information retrieved successfully",
      data: result,
    });
  }
);

// Get tenant subscription
const getTenantSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await SuperAdminServices.getTenantSubscriptionFromDB(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tenant subscription information retrieved successfully",
      data: result,
    });
  }
);

export const SuperAdminControllers = {
  getAllTenants,
  createTenant,
  updateTenant,
  getFullTenantData,
  getTenantDatabase,
  getTenantDeployment,
  getTenantSubscription,
};
