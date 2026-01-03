import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SalesServices } from "./sales.service";

const getAllSales = catchAsync(async (req, res) => {
  const status = req.query.status as string;
  const type = req.query.type as string;
  const merchantId = req.query.merchantId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const limit = parseInt(req.query.limit as string) || 100;

  const result = await SalesServices.getAllSales(
    status,
    type,
    merchantId,
    startDate,
    endDate,
    limit
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sales retrieved successfully",
    data: result,
  });
});

const createSale = catchAsync(async (req, res) => {
  const result = await SalesServices.createSale(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Sale recorded successfully",
    data: result,
  });
});

export const SalesControllers = {
  getAllSales,
  createSale,
};
