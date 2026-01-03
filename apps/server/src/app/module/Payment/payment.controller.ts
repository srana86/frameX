import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PaymentServices } from "./payment.service";

const getAllPayments = catchAsync(async (req, res) => {
  const status = req.query.status as string;
  const merchantId = req.query.merchantId as string;
  const limit = parseInt(req.query.limit as string) || 100;
  const page = parseInt(req.query.page as string) || 1;

  const result = await PaymentServices.getAllPayments(
    status,
    merchantId,
    limit,
    page
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payments retrieved successfully",
    data: result.payments,
    meta: {
      ...result.pagination,
      totalPage: result.pagination.totalPages,
    },
  });
});

const getPaymentStats = catchAsync(async (req, res) => {
  const result = await PaymentServices.getPaymentStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment stats retrieved successfully",
    data: result,
  });
});

const updatePaymentSession = catchAsync(async (req, res) => {
  const { tranId, status, valId, error, completedAt, failedAt } = req.body;
  const result = await PaymentServices.updatePaymentSession(tranId, {
    status,
    valId,
    error,
    completedAt,
    failedAt,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment session updated successfully",
    data: result,
  });
});

export const PaymentControllers = {
  getAllPayments,
  getPaymentStats,
  updatePaymentSession,
};
