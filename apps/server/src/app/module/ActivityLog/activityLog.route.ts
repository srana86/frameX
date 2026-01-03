import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { ActivityLogControllers } from "./activityLog.controller";
import { createActivityLogValidationSchema } from "./activityLog.validation";

const router = express.Router();

router.get("/", ActivityLogControllers.getAllActivityLogs);

router.post(
  "/",
  validateRequest(createActivityLogValidationSchema),
  ActivityLogControllers.createActivityLog
);

router.delete("/", ActivityLogControllers.deleteOldLogs);

export const ActivityLogRoutes = router;
