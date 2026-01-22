import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserServices } from "./user.service";

// Get all users with pagination, filter, and search
const getAllUsers = catchAsync(async (req, res) => {
  const tenantId = req.user.tenantId;
  const result = await UserServices.getAllUsersFromDB(tenantId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// Get single user by ID
const getSingleUser = catchAsync(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  const result = await UserServices.getSingleUserFromDB(tenantId, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

// Create user
const createUser = catchAsync(async (req, res) => {
  const tenantId = req.user.tenantId;
  const result = await UserServices.createUserIntoDB(tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

// Update user
const updateUser = catchAsync(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  const result = await UserServices.updateUserIntoDB(tenantId, id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

// Delete user (soft delete)
const deleteUser = catchAsync(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  const result = await UserServices.deleteUserFromDB(tenantId, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

// Change user status
const changeStatus = catchAsync(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { id } = req.params;
  const result = await UserServices.changeStatus(tenantId, id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});

export const UserControllers = {
  getAllUsers,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser,
  changeStatus,
};
