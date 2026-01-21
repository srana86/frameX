/* eslint-disable @typescript-eslint/no-explicit-any */
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { prisma } from "@framex/database";
import httpStatus from "http-status";

// Using Tenant instead of Tenant (merged models)
const getTenantSubscription = catchAsync(async (req, res) => {
  // Prioritize tenantId/x-tenant-id
  const tenantId =
    (req.query.tenantId as string) ||
    (req.headers["x-tenant-id"] as string) ||
    (req.query.tenantId as string) ||
    (req.headers["x-tenant-id"] as string);

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "tenantId is required",
      data: null,
    });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  if (!tenant) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Tenant not found",
      data: null,
    });
  }

  const subscription = await prisma.tenantSubscription.findFirst({
    where: { tenantId },
  });

  if (!subscription) {
    // Return tenant without subscription (keeping 'tenant' key for backward compat)
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Tenant found, no subscription",
      data: {
        tenant: tenant,
        subscription: null,
        plan: null,
      },
    });
  }

  const planId = subscription.planId;
  const plan = planId
    ? await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    : null;

  // Calculate dynamic status
  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  const graceEnd = subscription.gracePeriodEndsAt
    ? new Date(subscription.gracePeriodEndsAt)
    : null;

  let dynamicStatus: string = subscription.status;
  let isExpired = false;
  let isGracePeriod = false;
  let daysRemaining = Math.ceil(
    (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (subscription.status === "ACTIVE") {
    if (now > periodEnd) {
      if (graceEnd && now <= graceEnd) {
        dynamicStatus = "grace_period";
        isGracePeriod = true;
        daysRemaining = Math.ceil(
          (graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
      } else {
        dynamicStatus = "expired";
        isExpired = true;
        daysRemaining = 0;
      }
    }
  }

  const result = {
    tenant: tenant,
    subscription: {
      ...subscription,
      dynamicStatus,
      isExpired,
      isGracePeriod,
      daysRemaining,
      isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
      requiresPayment: isExpired || isGracePeriod,
    },
    plan,
  };

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tenant subscription fetched successfully",
    data: result,
  });
});

export const TenantSubscriptionControllers = {
  getTenantSubscription,
};
