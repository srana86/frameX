import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { VisitsServices } from "./visits.service";

// Track visit
const trackVisit = catchAsync(async (req: Request, res: Response) => {
  // Extract IP from request
  const ipAddress =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "";

  const tenantId = req.tenantId;

  if (!tenantId) {
    throw new Error("Tenant ID is missing");
  }

  const result = await VisitsServices.trackVisitFromDB(tenantId, {
    ...req.body,
    ipAddress,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

// Get visits
const getVisits = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  const result = await VisitsServices.getVisitsFromDB(tenantId as string, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Visits retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const VisitsControllers = {
  trackVisit,
  getVisits,
};
