import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { EmailProviderServices } from "./emailProvider.service";

// Get email provider settings
const getEmailSettings = catchAsync(async (req: Request, res: Response) => {
  const merchantId = undefined; // Get from context if available
  const result =
    await EmailProviderServices.getEmailProviderSettingsFromDB(merchantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email settings retrieved successfully",
    data: result,
  });
});

// Update email provider settings
const updateEmailSettings = catchAsync(async (req: Request, res: Response) => {
  const merchantId = undefined; // Get from context if available
  const result = await EmailProviderServices.updateEmailProviderSettingsFromDB(
    req.body,
    merchantId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email settings updated successfully",
    data: result,
  });
});

// Test email provider settings
const testEmailSettings = catchAsync(async (req: Request, res: Response) => {
  // TODO: Implement test email sending
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Test email sent successfully (placeholder)",
    data: { ok: true },
  });
});

export const EmailProviderControllers = {
  getEmailSettings,
  updateEmailSettings,
  testEmailSettings,
};
