import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TrackingServices } from "./tracking.service";

// Track Facebook event
const trackFBEvent = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const result = await TrackingServices.trackFBEventFromDB(tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Facebook event tracked successfully",
    data: result,
  });
});

// Get tracked Facebook events
const getFBEvents = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const result = await TrackingServices.getFBEventsFromDB(tenantId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Facebook events retrieved successfully",
    meta: result.meta,
    data: {
      events: result.data,
    },
  });
});

// Track Meta Pixel event
const trackMetaPixel = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const result = await TrackingServices.trackMetaPixelEventFromDB(tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Meta Pixel event tracked successfully",
    data: result,
  });
});

// Track TikTok Pixel event
const trackTikTokPixel = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const result = await TrackingServices.trackTikTokPixelEventFromDB(tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "TikTok Pixel event tracked successfully",
    data: result,
  });
});

// Track GA4 event
const trackGA4 = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const result = await TrackingServices.trackGA4EventFromDB(tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "GA4 event tracked successfully",
    data: result,
  });
});

export const TrackingControllers = {
  trackFBEvent,
  getFBEvents,
  trackMetaPixel,
  trackTikTokPixel,
  trackGA4,
};
