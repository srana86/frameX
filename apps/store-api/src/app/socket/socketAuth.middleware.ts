import { ExtendedError } from "socket.io/dist/namespace";
import { verifyToken } from "../utils/tokenGenerateFunction";
import config from "../../config";
import { AuthenticatedSocket } from "../types";
import { TJwtPayload } from "../module/Auth/auth.interface";

/**
 * Socket authentication middleware
 * Authenticates socket connections using JWT token from handshake
 * Rejects unauthorized connections early to prevent resource waste
 */
export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  try {
    // Extract token from handshake auth or query
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify JWT token
    const decoded = verifyToken(
      token as string,
      config.jwt_access_secret as string
    ) as TJwtPayload;

    if (!decoded.userId || !decoded.role) {
      return next(new Error("Invalid token payload"));
    }

    // Attach user info to socket for later use
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    socket.merchantId = decoded.userId; // Assuming userId is merchantId for now

    next();
  } catch (error: any) {
    next(new Error(`Authentication failed: ${error.message}`));
  }
};

/**
 * Role-based authorization for socket events
 * Use this as a wrapper for event handlers that require specific roles
 */
export const requireSocketRole = (...allowedRoles: string[]) => {
  return (socket: AuthenticatedSocket, next: (err?: ExtendedError) => void) => {
    if (!socket.userRole) {
      return next(new Error("User role not found"));
    }

    if (!allowedRoles.includes(socket.userRole)) {
      return next(new Error("Insufficient permissions"));
    }

    next();
  };
};
