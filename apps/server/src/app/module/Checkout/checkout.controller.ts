import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CheckoutServices } from "./checkout.service";
import config from "../../../config/index";

const initCheckout = catchAsync(async (req, res) => {
  const result = await CheckoutServices.initCheckout(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checkout initialized successfully",
    data: result,
  });
});

const getCheckoutSession = catchAsync(async (req, res) => {
  const { tran_id } = req.query;
  if (!tran_id) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Transaction ID required",
      data: null,
    });
  }

  const result = await CheckoutServices.getCheckoutSession(tran_id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checkout session retrieved successfully",
    data: result,
  });
});

const handleCheckoutSuccess = catchAsync(async (req, res) => {
  // Handle both POST (form data) and GET (query params)
  let data: Record<string, string> = {};

  if (req.method === "POST") {
    // Parse form-urlencoded data
    const formData = req.body;
    Object.keys(formData).forEach((key) => {
      data[key] = String(formData[key]);
    });
  } else {
    // GET request - use query params
    data = req.query as Record<string, string>;
  }

  const result = await CheckoutServices.handleCheckoutSuccess(data);
  const baseUrl = config.base_url || "http://localhost:5000";
  res.redirect(`${baseUrl}/checkout/success?tran_id=${result.tranId}`);
});

const handleCheckoutFail = catchAsync(async (req, res) => {
  let data: Record<string, string> = {};

  if (req.method === "POST") {
    const formData = req.body;
    Object.keys(formData).forEach((key) => {
      data[key] = String(formData[key]);
    });
  } else {
    data = req.query as Record<string, string>;
  }

  await CheckoutServices.handleCheckoutFail(data);
  const baseUrl = config.base_url || "http://localhost:5000";
  const reason = encodeURIComponent(data.error || "Payment was unsuccessful");
  res.redirect(`${baseUrl}/checkout/failed?reason=${reason}`);
});

const handleCheckoutCancel = catchAsync(async (req, res) => {
  let data: Record<string, string> = {};

  if (req.method === "POST") {
    const formData = req.body;
    Object.keys(formData).forEach((key) => {
      data[key] = String(formData[key]);
    });
  } else {
    data = req.query as Record<string, string>;
  }

  await CheckoutServices.handleCheckoutCancel(data);
  const baseUrl = config.base_url || "http://localhost:5000";
  res.redirect(`${baseUrl}/checkout/failed?reason=Payment+was+cancelled`);
});

const handleIPN = catchAsync(async (req, res) => {
  // Parse form-urlencoded data
  const formData = req.body;
  const data: Record<string, string> = {};
  Object.keys(formData).forEach((key) => {
    data[key] = String(formData[key]);
  });

  const result = await CheckoutServices.handleIPN(data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || "IPN processed successfully",
    data: result,
  });
});

export const CheckoutControllers = {
  initCheckout,
  getCheckoutSession,
  handleCheckoutSuccess,
  handleCheckoutFail,
  handleCheckoutCancel,
  handleIPN,
};
