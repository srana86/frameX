import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TenantServices } from "./tenant.service";

// Get tenant context
const getTenantContext = catchAsync(async (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string);
  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
      data: null,
    });
  }
  const result = await TenantServices.getTenantContextFromDB(tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tenant context retrieved successfully",
    data: result,
  });
});

// Get tenant data from brand config
const getTenantDataFromBrandConfig = catchAsync(
  async (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string);
    if (!tenantId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Tenant ID not found",
        data: null,
      });
    }
    const result = await TenantServices.getTenantDataFromBrandConfig(tenantId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Tenant data retrieved successfully",
      data: result,
    });
  }
);

// Get tenant plan subscription
const getTenantPlanSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const tenantId = (req.query.tenantId as string);
    if (!tenantId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Tenant ID not found",
        data: null,
      });
    }

    const result =
      await TenantServices.getTenantPlanSubscriptionFromDB(tenantId);

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
  const tenantId = (req.query.tenantId as string);
  const { features } = req.body;

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
      data: null,
    });
  }

  const result = await TenantServices.checkFeaturesFromDB(
    tenantId,
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
  const tenantId = (req.query.tenantId as string);

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
      data: null,
    });
  }

  const result = await TenantServices.getFeatureLimitsFromDB(tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Feature limits retrieved successfully",
    data: result,
  });
});

// Get feature usage
const getFeatureUsage = catchAsync(async (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string);

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
      data: null,
    });
  }

  const result = await TenantServices.getFeatureUsageFromDB(tenantId);

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

  const result = await TenantServices.checkFraudFromDB(phone);

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

  const result = await TenantServices.checkFraudFromDB(phone);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Fraud check completed",
    data: result,
  });
});

// Configure domain
const configureDomain = catchAsync(async (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string);
  const { domain } = req.body;

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
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

  const result = await TenantServices.configureDomainFromDB(
    tenantId,
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
  const tenantId = (req.query.tenantId as string);

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
      data: null,
    });
  }

  const result = await TenantServices.getDomainConfigFromDB(tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Domain configuration retrieved successfully",
    data: result,
  });
});

// Verify domain
const verifyDomain = catchAsync(async (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string);
  const { domain } = req.body;

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
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

  const result = await TenantServices.verifyDomainFromDB(tenantId, domain);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Domain verification completed",
    data: result,
  });
});

// Remove domain
const removeDomain = catchAsync(async (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string);

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
      data: null,
    });
  }

  const result = await TenantServices.removeDomainFromDB(tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Domain removed successfully",
    data: result,
  });
});

// Get super admin data
const getSuperAdminData = catchAsync(async (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string);
  const type = req.query.type as string | undefined;

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
      data: null,
    });
  }

  const result = await TenantServices.getSuperAdminDataFromDB(
    tenantId,
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
  const tenantId = (req.query.tenantId as string);

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
      data: null,
    });
  }

  const result = await TenantServices.getEmailSettingsFromDB(tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email settings retrieved successfully",
    data: result,
  });
});

// Update email settings
const updateEmailSettings = catchAsync(async (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string);

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
      data: null,
    });
  }

  const result = await TenantServices.updateEmailSettingsFromDB(
    tenantId,
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
  const result = await TenantServices.testEmailSettingsFromDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message || "Email test completed",
    data: result,
  });
});

// Get email templates
const getEmailTemplates = catchAsync(async (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string);
  const event = req.query.event as string | undefined;

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
      data: null,
    });
  }

  const result = await TenantServices.getEmailTemplatesFromDB(
    tenantId,
    event
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email templates retrieved successfully",
    data: result,
  });
});

// Update email templates
const updateEmailTemplates = catchAsync(async (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string);
  const { event, ...templateData } = req.body;

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
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

  const result = await TenantServices.updateEmailTemplatesFromDB(tenantId, {
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
  const tenantId = (req.query.tenantId as string);

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant ID not found",
      data: null,
    });
  }

  const result = await TenantServices.createEmailTemplateFromDB(
    tenantId,
    req.body
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Email template created successfully",
    data: result,
  });
});

export const TenantControllers = {
  getTenantContext,
  getTenantDataFromBrandConfig,
  getTenantPlanSubscription,
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
