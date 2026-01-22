/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import router from "./app/routes";
import notFound from "./app/middlewares/notFound";
import globalErrorHandler from "./app/middlewares/globalErrorhandler";
import requestLogger from "./app/middlewares/requestLogger";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";

const app: Application = express();

// Request logging middleware (should be early in the middleware chain)
app.use(requestLogger);

//parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form-urlencoded data (SSLCommerz callbacks)
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost", // nginx (dashboard)
      "http://localhost:3000", // direct store
      "http://localhost:3001", // direct dashboard
      process.env.DASHBOARD_URL,
    ].filter((origin): origin is string => typeof origin === "string"),
    credentials: true,
  })
);

// BetterAuth Handler
app.all("/api/auth/*", toNodeHandler(auth));

// Application routes
app.use("/api/v1", router);
app.use("/api/settings", router); // Alias for legacy/direct calls
app.use("/api/public/settings", router); // Another common pattern

app.get("/api", (req: Request, res: Response) => {
  res.send("Framex Tech API is running");
});

// This is connected with the globalErrorhandler.ts file at the middleware folder.
app.use(globalErrorHandler);

// This is connected with the notFound.ts file at the middleware folder.
app.use(notFound);

export default app;
