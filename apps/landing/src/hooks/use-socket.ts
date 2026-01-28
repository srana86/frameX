"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Helper to get cookie
  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  useEffect(() => {
    // Only connect on client side
    if (typeof window === "undefined") return;

    // Initialize socket connection
    const initializeSocket = async () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const token = getCookie("auth_token");

      // Determine backend URL - reuse API_URL but remove /api/v1 if present, or use default
      // If API_URL is http://localhost:5001/api/v1, we want http://localhost:5001
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
      const socketUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

      try {
        const newSocket = io(socketUrl, {
          path: "/socket.io", // Standard Socket.IO path
          transports: ["websocket", "polling"],
          auth: {
            token: token // Pass token for backend auth middleware
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: Infinity,
          timeout: 20000,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
        setConnectionError(null);

        newSocket.on("connect", () => {
          console.log("[Socket] Connected:", newSocket.id);
          setIsConnected(true);
          setConnectionError(null);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("[Socket] Disconnected:", reason);
          setIsConnected(false);

          // If disconnect was due to server not found, show helpful error
          if (reason === "io server disconnect" || reason === "transport close") {
            setConnectionError("Socket server unavailable. Make sure you're running with 'npm run dev:custom'");
          }
        });

        newSocket.on("connect_error", (error: Error) => {
          console.error("[Socket] Connection error:", error);
          setIsConnected(false);

          // Provide helpful error message
          if (error.message.includes("timeout") || error.message.includes("ECONNREFUSED")) {
            setConnectionError("Socket.IO server not available. Please run the app with 'npm run dev:custom' instead of 'npm run dev'");
          } else {
            setConnectionError(`Connection failed: ${error.message}`);
          }
        });

        newSocket.on("reconnect_attempt", (attemptNumber) => {
          console.log(`[Socket] Reconnection attempt ${attemptNumber}`);
        });

        newSocket.on("reconnect", (attemptNumber) => {
          console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
          setIsConnected(true);
          setConnectionError(null);
        });

        newSocket.on("reconnect_error", (error: Error) => {
          console.error("[Socket] Reconnection error:", error);
        });

        newSocket.on("reconnect_failed", () => {
          console.error("[Socket] Reconnection failed after all attempts");
          setConnectionError("Failed to reconnect to Socket.IO server. Please refresh the page or check if the server is running.");
        });
      } catch (error) {
        console.error("[Socket] Failed to initialize:", error);
        setConnectionError(`Failed to initialize socket: ${error instanceof Error ? error.message : "Unknown error"}`);

        // Fallback: use current origin directly
        const fallbackSocket = io(window.location.origin, {
          path: "/api/socket",
          transports: ["websocket", "polling"],
          upgrade: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: Infinity,
          timeout: 10000,
        });

        socketRef.current = fallbackSocket;
        setSocket(fallbackSocket);

        fallbackSocket.on("connect", () => {
          console.log("[Socket] Connected (fallback):", fallbackSocket.id);
          setIsConnected(true);
          setConnectionError(null);
        });

        fallbackSocket.on("disconnect", () => {
          console.log("[Socket] Disconnected");
          setIsConnected(false);
        });

        fallbackSocket.on("connect_error", (error: Error) => {
          console.error("[Socket] Connection error (fallback):", error);
          setIsConnected(false);
          setConnectionError("Socket.IO server not available. Please run the app with 'npm run dev:custom' instead of 'npm run dev'");
        });
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return { socket, isConnected, connectionError };
}
