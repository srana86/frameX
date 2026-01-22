import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StaffServices } from "./staff.service";

/**
 * Get all staff members for the owner
 */
const getOwnerStaff = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await StaffServices.getOwnerStaff(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Staff members retrieved successfully",
    data: result,
  });
});

/**
 * Get a specific staff member
 */
const getStaffById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { staffId } = req.params;
  const result = await StaffServices.getStaffById(userId, staffId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Staff member retrieved successfully",
    data: result,
  });
});

/**
 * Create a new staff member
 */
const createStaff = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await StaffServices.createStaff(userId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Staff member created successfully",
    data: result,
  });
});

/**
 * Update a staff member
 */
const updateStaff = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { staffId } = req.params;
  const result = await StaffServices.updateStaff(userId, staffId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Staff member updated successfully",
    data: result,
  });
});

/**
 * Update staff store access
 */
const updateStaffAccess = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { staffId } = req.params;
  const { storeAssignments } = req.body;
  const result = await StaffServices.updateStaffAccess(
    userId,
    staffId,
    storeAssignments
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Staff store access updated successfully",
    data: result,
  });
});

/**
 * Add store access for a staff member
 */
const addStoreAccess = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { staffId } = req.params;
  const { storeId, permission } = req.body;
  const result = await StaffServices.addStoreAccess(
    userId,
    staffId,
    storeId,
    permission
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Store access added successfully",
    data: result,
  });
});

/**
 * Remove store access for a staff member
 */
const removeStoreAccess = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { staffId, storeId } = req.params;
  const result = await StaffServices.removeStoreAccess(
    userId,
    staffId,
    storeId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Store access removed successfully",
    data: result,
  });
});

/**
 * Delete a staff member (removes all access)
 */
const deleteStaff = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { staffId } = req.params;
  const result = await StaffServices.deleteStaff(userId, staffId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

/**
 * Get owner's stores (for staff assignment)
 */
const getOwnerStores = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await StaffServices.getOwnerStores(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Stores retrieved successfully",
    data: result,
  });
});

/**
 * Get current staff user's store access
 */
const getMyStoreAccess = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await StaffServices.getMyStoreAccess(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Store access retrieved successfully",
    data: result,
  });
});

export const StaffControllers = {
  getOwnerStaff,
  getOwnerStores,
  getStaffById,
  createStaff,
  updateStaff,
  updateStaffAccess,
  addStoreAccess,
  removeStoreAccess,
  deleteStaff,
  getMyStoreAccess,
};
