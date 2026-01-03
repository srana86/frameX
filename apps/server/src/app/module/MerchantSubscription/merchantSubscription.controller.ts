import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Merchant } from "../Merchant/merchant.model";
import { Subscription } from "../Subscription/subscription.model";
import { Plan } from "../Plan/plan.model";
import httpStatus from "http-status";

/**
 * Get merchant subscription and plan data
 * Public endpoint for merchant apps to fetch their subscription details
 *
 * GET /api/v1/merchant-subscription?merchantId=xxx
 * OR use X-Merchant-ID header
 */
const getMerchantSubscription = catchAsync(async (req, res) => {
    // Get merchantId from query param or header
    const merchantId = req.query.merchantId as string || req.headers["x-merchant-id"] as string;

    if (!merchantId) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "merchantId is required (query param or X-Merchant-ID header)",
            data: null,
        });
    }

    // Get merchant details
    const merchant = await Merchant.findOne({ id: merchantId });

    if (!merchant) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Merchant not found",
            data: null,
        });
    }

    // Get subscription
    const subscription = await Subscription.findOne({ merchantId });

    if (!subscription) {
        // Return merchant without subscription (might be on free tier or not subscribed)
        const merchantData = merchant.toObject();
        delete (merchantData as any)._id;

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Merchant found, no subscription",
            data: {
                merchant: merchantData,
                subscription: null,
                plan: null,
            },
        });
    }

    // Get plan details
    const planId = subscription.planId;
    const plan = planId ? await Plan.findOne({ id: planId }) : null;

    // Clean up MongoDB _id fields
    const merchantData = merchant.toObject();
    delete (merchantData as any)._id;

    const subscriptionData = subscription.toObject();
    delete (subscriptionData as any)._id;

    const planData = plan ? (() => {
        const data = plan.toObject();
        delete (data as any)._id;
        return data;
    })() : null;

    // Calculate dynamic subscription status
    const now = new Date();
    const periodEnd = new Date(subscriptionData.currentPeriodEnd);
    const graceEnd = subscriptionData.gracePeriodEndsAt
        ? new Date(subscriptionData.gracePeriodEndsAt)
        : null;

    let dynamicStatus: string = subscriptionData.status;
    let isExpired = false;
    let isGracePeriod = false;
    let daysRemaining = Math.ceil(
        (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (subscriptionData.status === "active") {
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
        merchant: merchantData,
        subscription: {
            ...subscriptionData,
            dynamicStatus,
            isExpired,
            isGracePeriod,
            daysRemaining,
            isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
            requiresPayment: isExpired || isGracePeriod,
        },
        plan: planData,
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
