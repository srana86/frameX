import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CustomerServices } from "./customer.service";

// Get all customers
const getAllCustomers = catchAsync(async (req: Request, res: Response) => {
  const result = await CustomerServices.getAllCustomersFromDB(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Customers retrieved successfully",
    meta: result.meta,
    data: {
      customers: result.customers,
      stats: result.stats,
    },
  });
});

export const CustomerControllers = {
  getAllCustomers,
};
