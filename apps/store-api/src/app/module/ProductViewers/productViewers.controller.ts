import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProductViewersServices } from "./productViewers.service";

// Track product viewer
const trackProductViewer = catchAsync(async (req: Request, res: Response) => {
  const { slug, sessionId } = req.body;
  const result = await ProductViewersServices.trackProductViewerFromDB(
    slug,
    sessionId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Viewer tracked successfully",
    data: result,
  });
});

// Get viewer count
const getProductViewerCount = catchAsync(
  async (req: Request, res: Response) => {
    const { slug } = req.query;
    const result = await ProductViewersServices.getProductViewerCountFromDB(
      slug as string
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Viewer count retrieved successfully",
      data: result,
    });
  }
);

// Remove viewer
const removeProductViewer = catchAsync(async (req: Request, res: Response) => {
  const { slug, sessionId } = req.body;
  const result = await ProductViewersServices.removeProductViewerFromDB(
    slug,
    sessionId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Viewer removed successfully",
    data: result,
  });
});

export const ProductViewersControllers = {
  trackProductViewer,
  getProductViewerCount,
  removeProductViewer,
};
