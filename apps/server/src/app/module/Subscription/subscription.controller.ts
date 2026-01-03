import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SubscriptionServices } from "./subscription.service";

const getAllSubscriptions = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.getAllSubscriptions();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscriptions retrieved successfully",
    data: result,
  });
});

const getSubscriptionById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubscriptionServices.getSubscriptionById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription retrieved successfully",
    data: result,
  });
});

const createSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.createSubscription(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Subscription created successfully",
    data: result,
  });
});

const updateSubscription = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubscriptionServices.updateSubscription(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription updated successfully",
    data: result,
  });
});

const deleteSubscription = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubscriptionServices.deleteSubscription(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription deleted successfully",
    data: result,
  });
});

const getExpiringSubscriptions = catchAsync(async (req, res) => {
  const daysAhead = parseInt(req.query.days as string) || 7;
  const subscriptions =
    await SubscriptionServices.getExpiringSubscriptions(daysAhead);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Expiring subscriptions retrieved successfully",
    data: {
      count: subscriptions.length,
      subscriptions,
    },
  });
});

const renewSubscription = catchAsync(async (req, res) => {
  const {
    subscriptionId,
    billingCycleMonths,
    paymentAmount,
    paymentMethod,
    transactionId,
  } = req.body;
  const result = await SubscriptionServices.renewSubscription(
    subscriptionId,
    billingCycleMonths,
    paymentAmount,
    paymentMethod,
    transactionId
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription renewed successfully",
    data: result,
  });
});

export const SubscriptionControllers = {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getExpiringSubscriptions,
  renewSubscription,
};
