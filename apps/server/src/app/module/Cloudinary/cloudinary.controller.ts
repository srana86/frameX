import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CloudinaryServices } from "./cloudinary.service";

const uploadImage = catchAsync(async (req, res) => {
  const tenantId = (req.headers["x-tenant-id"] as string) || "unknown";

  // Handle multipart/form-data
  let file: any = null;
  let url: string | null = null;
  let folder = `tenants/${tenantId}`;
  let public_id: string | undefined;
  let resource_type = "auto";

  // Try to get from form data
  if (req.body && typeof req.body === "object") {
    file = req.body.file;
    url = req.body.url;
    folder = req.body.folder || folder;
    public_id = req.body.public_id;
    resource_type = req.body.resource_type || resource_type;
  }

  const result = await CloudinaryServices.uploadImage(
    file,
    url,
    folder,
    public_id,
    resource_type,
    tenantId
  );
  res.set(CloudinaryServices.corsHeaders);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Image uploaded successfully",
    data: result,
  });
});

const deleteImage = catchAsync(async (req, res) => {
  const tenantId = (req.headers["x-tenant-id"] as string) || "unknown";
  const { public_id, resource_type = "image" } = req.body;

  const result = await CloudinaryServices.deleteImage(
    public_id,
    resource_type,
    tenantId
  );
  res.set(CloudinaryServices.corsHeaders);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Image deleted successfully",
    data: result,
  });
});

const getCloudinaryConfig = catchAsync(async (req, res) => {
  const result = await CloudinaryServices.getCloudinaryConfig();
  res.set(CloudinaryServices.corsHeaders);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cloudinary config retrieved successfully",
    data: result,
  });
});

export const CloudinaryControllers = {
  uploadImage,
  deleteImage,
  getCloudinaryConfig,
};
