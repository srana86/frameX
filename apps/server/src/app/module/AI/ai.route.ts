import express from "express";
import { AIControllers } from "./ai.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/data", auth("admin", "tenant", "owner"), AIControllers.getAIData);
router.post("/chat", auth("admin", "tenant", "owner"), AIControllers.chatWithAI);

export const AIRoutes = router;
