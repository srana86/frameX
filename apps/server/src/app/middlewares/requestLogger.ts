import { Request, Response, NextFunction } from "express";

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.socket.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Log request body for POST/PUT/PATCH requests (excluding sensitive data)
  if (["POST", "PUT", "PATCH"].includes(method) && req.body) {
    const bodyCopy = { ...req.body };
    // Mask sensitive fields
    if (bodyCopy.password) bodyCopy.password = "***";
    if (bodyCopy.storePassword) bodyCopy.storePassword = "***";
    if (bodyCopy.token) bodyCopy.token = "***";
    console.log(`  Body:`, JSON.stringify(bodyCopy, null, 2));
  }

  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    console.log(`  Query:`, req.query);
  }

  next();
};

export default requestLogger;
