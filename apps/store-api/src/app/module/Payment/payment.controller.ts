import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PaymentServices } from "./payment.service";

// Get all payments
const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentServices.getAllPaymentsFromDB(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payments retrieved successfully",
    meta: result.meta,
    data: {
      payments: result.data,
    },
  });
});

// Get single payment
const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PaymentServices.getSinglePaymentFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment retrieved successfully",
    data: result,
  });
});

// Initialize payment
const initPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentServices.initPayment(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment initialized successfully",
    data: result,
  });
});

// Easy checkout
const easyCheckout = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentServices.easyCheckout(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Easy checkout initialized successfully",
    data: result,
  });
});

// Handle payment success
const handleSuccess = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentServices.handlePaymentSuccess({ ...req.query, ...req.body });
  res.redirect(result);
});

// Handle payment fail
const handleFail = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentServices.handlePaymentFail({ ...req.query, ...req.body });
  res.redirect(result);
});

// Handle payment cancel
const handleCancel = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentServices.handlePaymentCancel({ ...req.query, ...req.body });
  res.redirect(result);
});

// Handle payment IPN
const handleIPN = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentServices.handlePaymentIPN(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "IPN handled successfully",
    data: result,
  });
});

export const PaymentControllers = {
  getAllPayments,
  getSinglePayment,
  initPayment,
  easyCheckout,
  handleSuccess,
  handleFail,
  handleCancel,
  handleIPN,
};
