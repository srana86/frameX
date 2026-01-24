import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BlockedCustomerServices } from "./blockedCustomer.service";

const createBlockedCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const result = await BlockedCustomerServices.createBlockedCustomerIntoDB(
      req.tenantId,
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
    const result = await BlockedCustomerServices.getAllBlockedCustomersFromDB(req.tenantId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Blocked customers retrieved successfully",
      data: { blocked: result },
    });
  }
);

const checkBlockedCustomer = catchAsync(async (req: Request, res: Response) => {
  const { phone, email } = req.body;
  const result = await BlockedCustomerServices.checkBlockedCustomerFromDB(
    req.tenantId,
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
    const { id } = req.params;
    const result =
      await BlockedCustomerServices.getSingleBlockedCustomerFromDB(req.tenantId, id);

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
    const { id } = req.params;
    const result = await BlockedCustomerServices.updateBlockedCustomerIntoDB(
      req.tenantId,
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
    const { id } = req.params;
    await BlockedCustomerServices.deleteBlockedCustomerFromDB(req.tenantId, id);

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
