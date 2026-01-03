/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { User } from "./user.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { TUser } from "./user.interface";

// Get all users with pagination, filter, and search
const getAllUsersFromDB = async (query: Record<string, unknown>) => {
  // Query users where isDeleted is false or doesn't exist (for backward compatibility)
  const userQuery = new QueryBuilder(
    User.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }),
    query
  )
    .search(["fullName", "email", "phone"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

// Get single user by ID
const getSingleUserFromDB = async (id: string) => {
  const result = await User.findOne({ id, isDeleted: false });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return result;
};

// Create user
const createUserIntoDB = async (payload: TUser) => {
  const result = await User.create(payload);
  return result;
};

// Update user
const updateUserIntoDB = async (id: string, payload: Partial<TUser>) => {
  const result = await User.findOneAndUpdate(
    { id, isDeleted: false },
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return result;
};

// Delete user (soft delete)
const deleteUserFromDB = async (id: string) => {
  const result = await User.findOneAndUpdate(
    { id, isDeleted: false },
    { isDeleted: true },
    {
      new: true,
    }
  );

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return result;
};

// Change user status (for future use if needed)
const changeStatus = async (id: string, payload: Partial<TUser>) => {
  const result = await User.findOneAndUpdate(
    { id, isDeleted: false },
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return result;
};

export const UserServices = {
  getAllUsersFromDB,
  getSingleUserFromDB,
  createUserIntoDB,
  updateUserIntoDB,
  deleteUserFromDB,
  changeStatus,
};
