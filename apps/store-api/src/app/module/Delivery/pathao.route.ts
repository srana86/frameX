import express from "express";
import auth from "../../middlewares/auth";
import { PathaoControllers } from "./pathao.controller";

const router = express.Router();

// Pathao endpoints (admin/merchant)
router.get(
  "/cities",
  auth("admin", "merchant"),
  PathaoControllers.getPathaoCities
);
router.get(
  "/zones",
  auth("admin", "merchant"),
  PathaoControllers.getPathaoZones
);
router.get(
  "/areas",
  auth("admin", "merchant"),
  PathaoControllers.getPathaoAreas
);

export const PathaoRoutes = router;
