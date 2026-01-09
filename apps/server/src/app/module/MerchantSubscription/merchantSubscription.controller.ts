/* eslint-disable @typescript-eslint/no-explicit-any */
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { prisma } from "@framex/database";
import httpStatus from "http-status";

const getMerchantSubscription = catchAsync(async (req, res) => {
    const merchantId = req.query.merchantId as string || req.headers["x-merchant-id"] as string;

    if (!merchantId) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "merchantId is required",
            data: null,
        });
    }

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });

    if (!merchant) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Merchant not found",
            data: null,
        });
    }

    const subscription = await prisma.subscription.findFirst({ where: { merchantId } });

    if (!subscription) {
        // Return merchant without subscription
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Merchant found, no subscription",
            data: {
                merchant,
                subscription: null,
                plan: null,
            },
        });
    }

    const planId = subscription.planId;
    const plan = planId ? await prisma.plan.findUnique({ where: { id: planId } }) : null;

    // Calculate dynamic status
    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const graceEnd = subscription.gracePeriodEndsAt ? new Date(subscription.gracePeriodEndsAt) : null;

    let dynamicStatus: string = subscription.status; // Prisma status is Enum (ACTIVE, etc). Convert to string.
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
        merchant,
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
        message: "Merchant subscription fetched successfully",
        data: result,
    });
});

export const MerchantSubscriptionControllers = {
    getMerchantSubscription,
};
