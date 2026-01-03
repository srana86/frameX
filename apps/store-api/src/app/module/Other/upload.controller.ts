import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";

// Upload file to Cloudinary
const uploadFile = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "No file provided",
      data: null,
    });
  }

  const imageName =
    req.body.public_id ||
    `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const folder = req.body.folder || "uploads";

  const result = await sendImageToCloudinary(
    `${folder}/${imageName}`,
    file.path
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "File uploaded successfully",
    data: result,
  });
});

export const UploadControllers = {
  uploadFile,
};
