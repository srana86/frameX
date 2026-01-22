import express from "express";
import { upload } from "../../utils/sendImageToCloudinary";
import { UploadControllers } from "./upload.controller";

const router = express.Router();

// Upload file (single file)
router.post("/", upload.single("file"), UploadControllers.uploadFile);

export const UploadRoutes = router;
