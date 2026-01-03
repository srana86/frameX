import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import auth from "../../../middlewares/auth";
import { upload } from "../../../utils/sendImageToCloudinary";
import { HeroSlideControllers } from "./heroSlide.controller";
import { HeroSlideValidation } from "./heroSlide.validation";

const router = express.Router();

// Get enabled hero slides (public)
router.get("/", HeroSlideControllers.getEnabledHeroSlides);

// Get all hero slides (admin)
router.get(
  "/all",
  auth("admin", "merchant"),
  HeroSlideControllers.getAllHeroSlides
);

// Get single hero slide
router.get(
  "/:id",
  auth("admin", "merchant"),
  HeroSlideControllers.getSingleHeroSlide
);

// Create hero slide
router.post(
  "/",
  auth("admin", "merchant"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ]),
  validateRequest(HeroSlideValidation.createHeroSlideValidationSchema),
  HeroSlideControllers.createHeroSlide
);

// Update hero slide
router.put(
  "/:id",
  auth("admin", "merchant"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ]),
  validateRequest(HeroSlideValidation.updateHeroSlideValidationSchema),
  HeroSlideControllers.updateHeroSlide
);

// Delete hero slide
router.delete(
  "/:id",
  auth("admin", "merchant"),
  HeroSlideControllers.deleteHeroSlide
);

export const HeroSlideRoutes = router;
