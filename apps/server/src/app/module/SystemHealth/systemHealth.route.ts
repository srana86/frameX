import express from "express";
import { SystemHealthControllers } from "./systemHealth.controller";

const router = express.Router();

router.get("/", SystemHealthControllers.getSystemHealth);

export const SystemHealthRoutes = router;
