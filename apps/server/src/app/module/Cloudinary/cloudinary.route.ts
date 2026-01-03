import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { CloudinaryControllers } from "./cloudinary.controller";
import {
  uploadImageValidationSchema,
  deleteImageValidationSchema,
} from "./cloudinary.validation";
import { CloudinaryServices } from "./cloudinary.service";

const router = express.Router();

// CORS preflight
router.options("/*", (req, res) => {
  res.set(CloudinaryServices.corsHeaders);
  res.sendStatus(200);
});

router.post(
  "/upload",
  validateRequest(uploadImageValidationSchema),
  CloudinaryControllers.uploadImage
);

router.post(
  "/delete",
  validateRequest(deleteImageValidationSchema),
  CloudinaryControllers.deleteImage
);

router.delete(
  "/delete",
  validateRequest(deleteImageValidationSchema),
  CloudinaryControllers.deleteImage
);

router.get("/config", CloudinaryControllers.getCloudinaryConfig);

export const CloudinaryRoutes = router;
