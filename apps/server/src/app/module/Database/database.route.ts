import express from "express";
import { DatabaseControllers } from "./database.controller";

const router = express.Router();

router.get("/", DatabaseControllers.getAllDatabases);

export const DatabaseRoutes = router;
