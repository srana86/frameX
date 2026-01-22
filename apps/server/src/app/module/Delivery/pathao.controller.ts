import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PathaoServices } from "./pathao.service";

// Get Pathao cities
const getPathaoCities = catchAsync(async (req: Request, res: Response) => {
  const result = await PathaoServices.getPathaoCitiesFromDB((req as any).tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Pathao cities retrieved successfully",
    data: { cities: result },
  });
});

// Get Pathao zones
const getPathaoZones = catchAsync(async (req: Request, res: Response) => {
  const cityId = req.query.city_id as string;

  if (!cityId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "city_id parameter is required",
      data: null,
    });
  }

  const result = await PathaoServices.getPathaoZonesFromDB((req as any).tenantId, cityId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Pathao zones retrieved successfully",
    data: { zones: result },
  });
});

// Get Pathao areas
const getPathaoAreas = catchAsync(async (req: Request, res: Response) => {
  const zoneId = req.query.zone_id as string;

  if (!zoneId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "zone_id parameter is required",
      data: null,
    });
  }

  const result = await PathaoServices.getPathaoAreasFromDB((req as any).tenantId, zoneId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Pathao areas retrieved successfully",
    data: { areas: result },
  });
});

export const PathaoControllers = {
  getPathaoCities,
  getPathaoZones,
  getPathaoAreas,
};
