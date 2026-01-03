import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { HeroSlideServices } from "./heroSlide.service";

// Get enabled hero slides
const getEnabledHeroSlides = catchAsync(async (req: Request, res: Response) => {
  const result = await HeroSlideServices.getEnabledHeroSlidesFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Hero slides retrieved successfully",
    data: result,
  });
});

// Get all hero slides
const getAllHeroSlides = catchAsync(async (req: Request, res: Response) => {
  const result = await HeroSlideServices.getAllHeroSlidesFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Hero slides retrieved successfully",
    data: result,
  });
});

// Get single hero slide
const getSingleHeroSlide = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await HeroSlideServices.getSingleHeroSlideFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Hero slide retrieved successfully",
    data: result,
  });
});

// Create hero slide
const createHeroSlide = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as {
    image?: Express.Multer.File[];
    mobileImage?: Express.Multer.File[];
  };
  const result = await HeroSlideServices.createHeroSlideIntoDB(req.body, files);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Hero slide created successfully",
    data: result,
  });
});

// Update hero slide
const updateHeroSlide = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const files = req.files as {
    image?: Express.Multer.File[];
    mobileImage?: Express.Multer.File[];
  };
  const result = await HeroSlideServices.updateHeroSlideIntoDB(
    id,
    req.body,
    files
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Hero slide updated successfully",
    data: result,
  });
});

// Delete hero slide
const deleteHeroSlide = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await HeroSlideServices.deleteHeroSlideFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Hero slide deleted successfully",
    data: result,
  });
});

export const HeroSlideControllers = {
  getEnabledHeroSlides,
  getAllHeroSlides,
  getSingleHeroSlide,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
};
