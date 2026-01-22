import express from "express";
import { OtherControllers } from "./other.controller";

const router = express.Router();

// Get environment config
router.get("/env/config", OtherControllers.getEnvConfig);

// Get geolocation
router.get("/geolocation", OtherControllers.getGeolocation);

// Get socket config
router.get("/socket/config", OtherControllers.getSocketConfig);

export const OtherRoutes = router;
