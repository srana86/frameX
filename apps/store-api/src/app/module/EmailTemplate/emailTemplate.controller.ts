import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { EmailTemplateServices } from "./emailTemplate.service";

// Get email templates
const getEmailTemplates = catchAsync(async (req: Request, res: Response) => {
  const event = req.query.event as string | undefined;
  const merchantId = undefined; // Get from context if available
  const result = await EmailTemplateServices.getEmailTemplatesFromDB(
    merchantId,
    event as any
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email templates retrieved successfully",
    data: result,
  });
});

// Update email template
const updateEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const { event, ...templateData } = req.body;

  if (!event) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Event is required",
      data: null,
    });
  }

  const merchantId = undefined; // Get from context if available
  const result = await EmailTemplateServices.updateEmailTemplateFromDB(
    event,
    templateData,
    merchantId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email template updated successfully",
    data: result,
  });
});

// Create email template
const createEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const merchantId = undefined; // Get from context if available
  const result = await EmailTemplateServices.createEmailTemplateFromDB(
    req.body,
    merchantId
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Email template created successfully",
    data: result,
  });
});

// Test email template
const testEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  // TODO: Implement test email sending
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Test email sent successfully (placeholder)",
    data: { ok: true },
  });
});

export const EmailTemplateControllers = {
  getEmailTemplates,
  updateEmailTemplate,
  createEmailTemplate,
  testEmailTemplate,
};
