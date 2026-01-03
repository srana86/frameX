import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DatabaseServices } from "./database.service";

const getAllDatabases = catchAsync(async (req, res) => {
  const result = await DatabaseServices.getAllDatabases();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Databases retrieved successfully",
    data: result,
  });
});

export const DatabaseControllers = {
  getAllDatabases,
};
