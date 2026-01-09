import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MerchantServices } from "./merchant.service";

// Get merchant context
const getMerchantContext = catchAsync(async (req: Request, res: Response) => {
  const merchantId = (req.query.merchantId as string) || req.user?.userId;
  const result = await MerchantServices.getMerchantContextFromDB(merchantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant context retrieved successfully",
    data: result,
  });
});

// Get merchant data from brand config
const getMerchantDataFromBrandConfig = catchAsync(
  async (req: Request, res: Response) => {
    const merchantId = req.user?.userId;
    if (!merchantId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Merchant ID not found",
        data: null,
      });
    }
    const result = await MerchantServices.getMerchantDataFromBrandConfig(merchantId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Merchant data retrieved successfully",
      data: result,
    });
  }
);

// Get merchant plan subscription
const getMerchantPlanSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const merchantId = req.user?.userId;
    if (!merchantId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Merchant ID not found",
        data: null,
      });
    }

    const result =
      await MerchantServices.getMerchantPlanSubscriptionFromDB(merchantId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Plan subscription retrieved successfully",
      data: result,
    });
  }
);

// Check features
const checkFeatures = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;
  const { features } = req.body;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  if (!Array.isArray(features)) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Features must be an array",
      data: null,
    });
  }

  const result = await MerchantServices.checkFeaturesFromDB(
    merchantId,
    features
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Features checked successfully",
    data: result,
  });
});

// Get feature limits
const getFeatureLimits = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  const result = await MerchantServices.getFeatureLimitsFromDB(merchantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Feature limits retrieved successfully",
    data: result,
  });
});

// Get feature usage
const getFeatureUsage = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  const result = await MerchantServices.getFeatureUsageFromDB(merchantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Feature usage retrieved successfully",
    data: result,
  });
});

// Get fraud check
const getFraudCheck = catchAsync(async (req: Request, res: Response) => {
  const phone = req.query.phone as string;

  if (!phone) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Phone number is required",
      data: null,
    });
  }

  const result = await MerchantServices.checkFraudFromDB(phone);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Fraud check completed",
    data: result,
  });
});

// POST fraud check
const postFraudCheck = catchAsync(async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Phone number is required",
      data: null,
    });
  }

  const result = await MerchantServices.checkFraudFromDB(phone);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Fraud check completed",
    data: result,
  });
});

// Configure domain
const configureDomain = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;
  const { domain } = req.body;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  if (!domain) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Domain is required",
      data: null,
    });
  }

  const result = await MerchantServices.configureDomainFromDB(
    merchantId,
    domain
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Domain configured successfully",
    data: result,
  });
});

// Get domain config
const getDomainConfig = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  const result = await MerchantServices.getDomainConfigFromDB(merchantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Domain configuration retrieved successfully",
    data: result,
  });
});

// Verify domain
const verifyDomain = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;
  const { domain } = req.body;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  if (!domain) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Domain is required",
      data: null,
    });
  }

  const result = await MerchantServices.verifyDomainFromDB(merchantId, domain);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Domain verification completed",
    data: result,
  });
});

// Remove domain
const removeDomain = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  const result = await MerchantServices.removeDomainFromDB(merchantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Domain removed successfully",
    data: result,
  });
});

// Get super admin data
const getSuperAdminData = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;
  const type = req.query.type as string | undefined;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  const result = await MerchantServices.getSuperAdminDataFromDB(
    merchantId,
    type
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Super admin data retrieved successfully",
    data: result,
  });
});

// Get email settings
const getEmailSettings = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  const result = await MerchantServices.getEmailSettingsFromDB(merchantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email settings retrieved successfully",
    data: result,
  });
});

// Update email settings
const updateEmailSettings = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  const result = await MerchantServices.updateEmailSettingsFromDB(
    merchantId,
    req.body
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email settings updated successfully",
    data: result,
  });
});

// Test email settings
const testEmailSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await MerchantServices.testEmailSettingsFromDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message || "Email test completed",
    data: result,
  });
});

// Get email templates
const getEmailTemplates = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;
  const event = req.query.event as string | undefined;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  const result = await MerchantServices.getEmailTemplatesFromDB(
    merchantId,
    event
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email templates retrieved successfully",
    data: result,
  });
});

// Update email templates (updates a single template by event)
const updateEmailTemplates = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;
  const { event, ...templateData } = req.body;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  if (!event) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Event is required",
      data: null,
    });
  }

  const result = await MerchantServices.updateEmailTemplatesFromDB(merchantId, {
    event,
    template: templateData,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email template updated successfully",
    data: result,
  });
});

// Create email template
const createEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const merchantId = req.user?.userId;

  if (!merchantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID not found",
      data: null,
    });
  }

  const result = await MerchantServices.createEmailTemplateFromDB(
    merchantId,
    req.body
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Email template created successfully",
    data: result,
  });
});

export const MerchantControllers = {
  getMerchantContext,
  getMerchantDataFromBrandConfig,
  getMerchantPlanSubscription,
  checkFeatures,
  getFeatureLimits,
  getFeatureUsage,
  getFraudCheck,
  postFraudCheck,
  configureDomain,
  getDomainConfig,
  verifyDomain,
  removeDomain,
  getSuperAdminData,
  getEmailSettings,
  updateEmailSettings,
  testEmailSettings,
  getEmailTemplates,
  updateEmailTemplates,
  createEmailTemplate,
};
