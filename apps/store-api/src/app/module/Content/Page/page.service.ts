/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Page, PageCategory } from "./page.model";
import { TPage, TPageCategory } from "./page.interface";

// Get all pages
const getAllPagesFromDB = async () => {
  const result = await Page.find().sort({ order: 1 });
  return result;
};

// Get enabled pages only
const getEnabledPagesFromDB = async () => {
  const result = await Page.find({ enabled: true }).sort({ order: 1 });
  return result;
};

// Get page by slug
const getPageBySlugFromDB = async (slug: string) => {
  const result = await Page.findOne({ slug });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Page not found");
  }

  return result;
};

// Create page
const createPageIntoDB = async (payload: TPage) => {
  // Generate ID if not provided
  if (!payload.id) {
    payload.id = `PAGE${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate slug if not provided
  if (!payload.slug && payload.title) {
    payload.slug = payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const result = await Page.create(payload);
  return result;
};

// Update page
const updatePageIntoDB = async (slug: string, payload: Partial<TPage>) => {
  const result = await Page.findOneAndUpdate({ slug }, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Page not found");
  }

  return result;
};

// Delete page
const deletePageFromDB = async (slug: string) => {
  const result = await Page.findOneAndDelete({ slug });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Page not found");
  }

  return { success: true };
};

// Get page categories
const getPageCategoriesFromDB = async () => {
  const result = await PageCategory.find().sort({ order: 1 });
  return result;
};

// Create page category
const createPageCategoryIntoDB = async (payload: TPageCategory) => {
  // Generate ID if not provided
  if (!payload.id) {
    payload.id = `PGCAT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  const result = await PageCategory.create(payload);
  return result;
};

// Update page category
const updatePageCategoryIntoDB = async (
  id: string,
  payload: Partial<TPageCategory>
) => {
  const result = await PageCategory.findOneAndUpdate({ id }, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Page category not found");
  }

  return result;
};

// Delete page category
const deletePageCategoryFromDB = async (id: string) => {
  const result = await PageCategory.findOneAndDelete({ id });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Page category not found");
  }

  return { success: true };
};

export const PageServices = {
  getAllPagesFromDB,
  getEnabledPagesFromDB,
  getPageBySlugFromDB,
  createPageIntoDB,
  updatePageIntoDB,
  deletePageFromDB,
  getPageCategoriesFromDB,
  createPageCategoryIntoDB,
  updatePageCategoryIntoDB,
  deletePageCategoryFromDB,
};
