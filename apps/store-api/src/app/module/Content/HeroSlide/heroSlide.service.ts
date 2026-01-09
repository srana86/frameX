/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@framex/database";
import { THeroSlide } from "./heroSlide.interface";
import { sendImageToCloudinary } from "../../../utils/sendImageToCloudinary";

// Get enabled hero slides
const getEnabledHeroSlidesFromDB = async (tenantId: string) => {
  const result = await prisma.heroSlide.findMany({
    where: { tenantId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return result;
};

// Get all hero slides
const getAllHeroSlidesFromDB = async (tenantId: string) => {
  const result = await prisma.heroSlide.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
  return result;
};

// Get single hero slide
const getSingleHeroSlideFromDB = async (tenantId: string, id: string) => {
  const result = await prisma.heroSlide.findFirst({
    where: { tenantId, id },
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Hero slide not found");
  }

  return result;
};

// Create hero slide
const createHeroSlideIntoDB = async (
  tenantId: string,
  payload: THeroSlide,
  files?: { image?: Express.Multer.File[]; mobileImage?: Express.Multer.File[] }
) => {
  // Upload images if provided
  let image = payload.image;
  let mobileImage = payload.mobileImage;

  if (files?.image && files.image.length > 0) {
    const uploadedImage = await sendImageToCloudinary(
      `hero-slide-${Date.now()}`,
      files.image[0].path
    );
    image = (uploadedImage as any).secure_url || (uploadedImage as any).url;
  }

  if (files?.mobileImage && files.mobileImage.length > 0) {
    const uploadedMobileImage = await sendImageToCloudinary(
      `hero-slide-mobile-${Date.now()}`,
      files.mobileImage[0].path
    );
    mobileImage =
      (uploadedMobileImage as any).secure_url ||
      (uploadedMobileImage as any).url;
  }

  if (!image) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Image is required");
  }

  const result = await prisma.heroSlide.create({
    data: {
      tenantId,
      title: payload.title,
      subtitle: payload.subtitle,
      image,
      mobileImage,
      link: payload.link ?? payload.buttonLink ?? null,
      isActive: payload.isActive ?? payload.enabled ?? true,
      sortOrder: payload.order || 0,
    },
  });
  return result;
};

// Update hero slide
const updateHeroSlideIntoDB = async (
  tenantId: string,
  id: string,
  payload: Partial<THeroSlide>,
  files?: { image?: Express.Multer.File[]; mobileImage?: Express.Multer.File[] }
) => {
  const existing = await prisma.heroSlide.findFirst({
    where: { tenantId, id },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Hero slide not found");
  }

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

  const updateData: any = { ...payload };
  if (payload.order !== undefined) {
    updateData.sortOrder = payload.order;
    delete updateData.order;
  }

  // Handle link/buttonLink mapping
  if (payload.link !== undefined) {
    updateData.link = payload.link;
  } else if (payload.buttonLink !== undefined) {
    updateData.link = payload.buttonLink;
  }

  // Handle isActive/enabled mapping
  if (payload.isActive !== undefined) {
    updateData.isActive = payload.isActive;
  } else if (payload.enabled !== undefined) {
    updateData.isActive = payload.enabled;
  }

  // Clean up non-Prisma fields
  delete updateData.buttonLink;
  delete updateData.enabled;

  const result = await prisma.heroSlide.update({
    where: { id: existing.id },
    data: updateData,
  });

  return result;
};

// Delete hero slide
const deleteHeroSlideFromDB = async (tenantId: string, id: string) => {
  const existing = await prisma.heroSlide.findFirst({
    where: { tenantId, id },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Hero slide not found");
  }

  await prisma.heroSlide.delete({
    where: { id: existing.id },
  });

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
