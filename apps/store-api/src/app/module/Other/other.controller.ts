import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import config from "../../../config";
import { getUserLocation } from "../../utils/geolocation";

// Get environment config (masked)
const getEnvConfig = catchAsync(async (req: Request, res: Response) => {
  // Return masked environment variables
  const maskedConfig = {
    envLines12to16: {
      ENCRYPTION_KEY: "***",
      GITHUB_REPO: config.NODE_ENV,
      GITHUB_TOKEN: "***",
      MONGODB_DB: config.database_url?.split("/").pop() || "",
    },
    validation: {
      valid: true,
      missing: [],
      invalid: [],
      allEnvVars: {
        NODE_ENV: config.NODE_ENV,
        PORT: config.port,
        // Mask sensitive values
        DATABASE_URL: config.database_url ? "***" : undefined,
      },
    }
  };

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Environment config retrieved successfully",
    data: maskedConfig,
  });
});

// Get geolocation
const getGeolocation = catchAsync(async (req: Request, res: Response) => {
  // Extract IP from request
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "";

  // Get location from utility
  const location = await getUserLocation(ip);

  const geolocation = {
    ip,
    country: location?.country,
    countryCode: location?.countryCode,
    region: undefined,
    city: undefined,
  };

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Geolocation retrieved successfully",
    data: geolocation,
  });
});

// Get socket config
const getSocketConfig = catchAsync(async (req: Request, res: Response) => {
  const baseUrl = req.headers.host || "localhost:3000";
  const protocol = req.protocol || "http";

  const socketConfig = {
    socketUrl: `${protocol}://${baseUrl}`,
    path: "/api/socket",
    transports: ["websocket", "polling"],
  };

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Socket config retrieved successfully",
    data: socketConfig,
  });
});

export const OtherControllers = {
  getEnvConfig,
  getGeolocation,
  getSocketConfig,
};
