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
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      process.env.DASHBOARD_URL,
    ].filter((origin): origin is string => typeof origin === "string"),
    credentials: true,
  })
);

// Application routes
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from boiler plate code");
});

// This is connected with the globalErrorhandler.ts file at the middleware folder.
app.use(globalErrorHandler);

// This is connected with the notFound.ts file at the middleware folder.
app.use(notFound);

export default app;
