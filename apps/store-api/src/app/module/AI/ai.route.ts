import express from "express";
import { AIControllers } from "./ai.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/data", auth("admin", "tenant"), AIControllers.getAIData);
router.post("/chat", auth("admin", "tenant"), AIControllers.chatWithAI);

export const AIRoutes = router;
