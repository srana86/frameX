import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatisticsServices } from "./statistics.service";

// Get comprehensive statistics
const getStatistics = catchAsync(async (req: Request, res: Response) => {
  const result = await StatisticsServices.getStatisticsFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Statistics retrieved successfully",
    data: result,
  });
});

export const StatisticsControllers = {
  getStatistics,
};
