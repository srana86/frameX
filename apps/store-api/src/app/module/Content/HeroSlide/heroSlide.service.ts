/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { HeroSlide } from "./heroSlide.model";
import { THeroSlide } from "./heroSlide.interface";
import { sendImageToCloudinary } from "../../../utils/sendImageToCloudinary";

// Get enabled hero slides
const getEnabledHeroSlidesFromDB = async () => {
  const result = await HeroSlide.find({ enabled: true }).sort({ order: 1 });
  return result;
};

// Get all hero slides
const getAllHeroSlidesFromDB = async () => {
  const result = await HeroSlide.find().sort({ order: 1 });
  return result;
};

// Get single hero slide
const getSingleHeroSlideFromDB = async (id: string) => {
  const result = await HeroSlide.findOne({ id });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Hero slide not found");
  }

  return result;
};

// Create hero slide
const createHeroSlideIntoDB = async (
  payload: THeroSlide,
  files?: { image?: Express.Multer.File[]; mobileImage?: Express.Multer.File[] }
) => {
  // Generate ID if not provided
  if (!payload.id) {
    payload.id = `HS${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  // Upload images if provided
  if (files?.image && files.image.length > 0) {
    const uploadedImage = await sendImageToCloudinary(
      `hero-slide-${payload.id}`,
      files.image[0].path
    );
    payload.image =
      (uploadedImage as any).secure_url || (uploadedImage as any).url;
  }

  if (files?.mobileImage && files.mobileImage.length > 0) {
    const uploadedMobileImage = await sendImageToCloudinary(
      `hero-slide-mobile-${payload.id}`,
      files.mobileImage[0].path
    );
    payload.mobileImage =
      (uploadedMobileImage as any).secure_url ||
      (uploadedMobileImage as any).url;
  }

  const result = await HeroSlide.create(payload);
  return result;
};

// Update hero slide
const updateHeroSlideIntoDB = async (
  id: string,
  payload: Partial<THeroSlide>,
  files?: { image?: Express.Multer.File[]; mobileImage?: Express.Multer.File[] }
) => {
  // Upload new images if provided
  if (files?.image && files.image.length > 0) {
    const uploadedImage = await sendImageToCloudinary(
      `hero-slide-${id}`,
      files.image[0].path
    );
    payload.image =
      (uploadedImage as any).secure_url || (uploadedImage as any).url;
  }

  if (files?.mobileImage && files.mobileImage.length > 0) {
    const uploadedMobileImage = await sendImageToCloudinary(
      `hero-slide-mobile-${id}`,
      files.mobileImage[0].path
    );
    payload.mobileImage =
      (uploadedMobileImage as any).secure_url ||
      (uploadedMobileImage as any).url;
  }

  const result = await HeroSlide.findOneAndUpdate({ id }, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Hero slide not found");
  }

  return result;
};

// Delete hero slide
const deleteHeroSlideFromDB = async (id: string) => {
  const result = await HeroSlide.findOneAndDelete({ id });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Hero slide not found");
  }

  return { success: true };
};

export const HeroSlideServices = {
  getEnabledHeroSlidesFromDB,
  getAllHeroSlidesFromDB,
  getSingleHeroSlideFromDB,
  createHeroSlideIntoDB,
  updateHeroSlideIntoDB,
  deleteHeroSlideFromDB,
};
