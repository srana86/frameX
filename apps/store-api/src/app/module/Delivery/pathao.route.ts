import express from "express";
import auth from "../../middlewares/auth";
import { PathaoControllers } from "./pathao.controller";

const router = express.Router();

// Pathao endpoints (admin/tenant)
router.get(
  "/cities",
  auth("admin", "tenant"),
  PathaoControllers.getPathaoCities
);
router.get(
  "/zones",
  auth("admin", "tenant"),
  PathaoControllers.getPathaoZones
);
router.get(
  "/areas",
  auth("admin", "tenant"),
  PathaoControllers.getPathaoAreas
);

export const PathaoRoutes = router;
