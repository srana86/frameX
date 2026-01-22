import { Socket as ServerSocket } from "socket.io";

export interface AuthenticatedSocket extends ServerSocket {
  userId?: string;
  userRole?: string;
  tenantId?: string;
}

export interface SocketConfig {
  redisUrl?: string;
  redisHost?: string;
  redisPort?: number;
  redisPassword?: string;
  corsOrigin?: string | string[];
  path?: string;
  pingTimeout?: number;
  pingInterval?: number;
}

export interface SocketMetrics {
  connections: number;
  eventsEmitted: number;
  eventsReceived: number;
  errors: number;
  slowEvents: number; // Events > 100ms
}

export interface SocketEventLog {
  event: string;
  socketId: string;
  userId?: string;
  duration: number;
  timestamp: Date;
  error?: string;
}
