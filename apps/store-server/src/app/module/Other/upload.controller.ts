import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { AssetServices } from "../Asset/asset.service";

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

  // Create asset record if tenant is available
  const tenantId = req.tenantId || req.user?.tenantId;
  let asset: { id: string } | null = null;


  if (tenantId && result) {
    try {
      asset = await AssetServices.createAsset(tenantId, {
        public_id: result.public_id as string,
        secure_url: result.secure_url as string,
        url: result.url as string,
        format: result.format as string,
        width: result.width as number,
        height: result.height as number,
        bytes: result.bytes as number,
        resource_type: result.resource_type as string,
        folder,
      });
    } catch (error) {
      // Log error but don't fail the upload
      console.error("[Asset] Failed to create asset record:", error);
    }
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "File uploaded successfully",
    data: {
      ...result,
      assetId: asset?.id,
    },
  });
});

export const UploadControllers = {
  uploadFile,
};
