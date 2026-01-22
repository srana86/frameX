import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { PageServices } from "./page.service";

// Get all pages
const getAllPages = catchAsync(async (req: Request, res: Response) => {
  const result = await PageServices.getAllPagesFromDB(req.tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Pages retrieved successfully",
    data: { pages: result },
  });
});

// Get enabled pages
const getEnabledPages = catchAsync(async (req: Request, res: Response) => {
  const result = await PageServices.getEnabledPagesFromDB(req.tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Pages retrieved successfully",
    data: result,
  });
});

// Get page by slug
const getPageBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await PageServices.getPageBySlugFromDB(req.tenantId, slug);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Page retrieved successfully",
    data: result,
  });
});

// Create page
const createPage = catchAsync(async (req: Request, res: Response) => {
  const result = await PageServices.createPageIntoDB(req.tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Page created successfully",
    data: result,
  });
});

// Update page
const updatePage = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await PageServices.updatePageIntoDB(req.tenantId, slug, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Page updated successfully",
    data: result,
  });
});

// Delete page
const deletePage = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await PageServices.deletePageFromDB(req.tenantId, slug);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Page deleted successfully",
    data: result,
  });
});

// Get page categories
const getPageCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await PageServices.getPageCategoriesFromDB(req.tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Page categories retrieved successfully",
    data: { categories: result },
  });
});

// Create page category
const createPageCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await PageServices.createPageCategoryIntoDB(req.tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Page category created successfully",
    data: result,
  });
});

// Update page category
const updatePageCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PageServices.updatePageCategoryIntoDB(req.tenantId, id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Page category updated successfully",
    data: result,
  });
});

// Delete page category
const deletePageCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PageServices.deletePageCategoryFromDB(req.tenantId, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Page category deleted successfully",
    data: result,
  });
});

export const PageControllers = {
  getAllPages,
  getEnabledPages,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  getPageCategories,
  createPageCategory,
  updatePageCategory,
  deletePageCategory,
};
