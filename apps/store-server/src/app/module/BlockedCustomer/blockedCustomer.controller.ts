import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BlockedCustomerServices } from "./blockedCustomer.service";

const createBlockedCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await BlockedCustomerServices.createBlockedCustomerIntoDB(
      user.tenantId,
      req.body
    );

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Customer blocked successfully",
      data: result,
    });
  }
);

const getAllBlockedCustomers = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await BlockedCustomerServices.getAllBlockedCustomersFromDB(user.tenantId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Blocked customers retrieved successfully",
      data: { blocked: result },
    });
  }
);

const checkBlockedCustomer = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { phone, email } = req.body;
  const result = await BlockedCustomerServices.checkBlockedCustomerFromDB(
    user.tenantId,
    phone,
    email
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Block status checked successfully",
    data: result,
  });
});

const getSingleBlockedCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    const result =
      await BlockedCustomerServices.getSingleBlockedCustomerFromDB(user.tenantId, id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Blocked customer retrieved successfully",
      data: result,
    });
  }
);

const updateBlockedCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    const result = await BlockedCustomerServices.updateBlockedCustomerIntoDB(
      user.tenantId,
      id,
      req.body
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Blocked customer updated successfully",
      data: { success: true, customer: result },
    });
  }
);

const deleteBlockedCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    await BlockedCustomerServices.deleteBlockedCustomerFromDB(user.tenantId, id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Customer unblocked successfully",
      data: { success: true, message: "Customer unblocked" },
    });
  }
);

export const BlockedCustomerControllers = {
  createBlockedCustomer,
  getAllBlockedCustomers,
  checkBlockedCustomer,
  getSingleBlockedCustomer,
  updateBlockedCustomer,
  deleteBlockedCustomer,
};
