import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ActivityLogServices } from "./activityLog.service";

const getAllActivityLogs = catchAsync(async (req, res) => {
  const type = req.query.type as string;
  const action = req.query.action as string;
  const entityId = req.query.entityId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const result = await ActivityLogServices.getAllActivityLogs(
    type,
    action,
    entityId,
    startDate,
    endDate,
    page,
    limit
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Activity logs retrieved successfully",
    data: result.logs,
    meta: {
      ...result.pagination,
      totalPage: result.pagination.totalPages,
    },
  });
});

const createActivityLog = catchAsync(async (req, res) => {
  const ipAddress =
    (req.headers["x-forwarded-for"] as string) ||
    (req.headers["x-real-ip"] as string) ||
    req.ip;
  const userAgent = req.headers["user-agent"];

  const result = await ActivityLogServices.createActivityLog({
    ...req.body,
    ipAddress,
    userAgent,
  });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Activity log created successfully",
    data: result,
  });
});

const deleteOldLogs = catchAsync(async (req, res) => {
  const olderThanDays = parseInt(req.query.olderThanDays as string) || 90;
  const result = await ActivityLogServices.deleteOldLogs(olderThanDays);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Old logs deleted successfully",
    data: result,
  });
});

export const ActivityLogControllers = {
  getAllActivityLogs,
  createActivityLog,
  deleteOldLogs,
};
