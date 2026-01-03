"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only connect on client side
    if (typeof window === "undefined") return;

    // Fetch dynamic socket config for multi-tenant support
    const initializeSocket = async () => {
      // Clear any existing socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      try {
        // Try to get socket URL from API (supports dynamic domains)
        let socketUrl = window.location.origin; // Default fallback

        try {
          const configRes = await fetch("/api/socket/config", {
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });

          if (configRes.ok) {
            const config = await configRes.json();
            socketUrl = config.socketUrl || window.location.origin;
          } else {
            // Fallback to env or current origin
            socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
          }
        } catch (fetchError) {
          console.warn("[Socket] Failed to fetch config, using default:", fetchError);
          socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
        }

        const newSocket = io(socketUrl, {
          path: "/api/socket",
          transports: ["websocket", "polling"], // Prefer WebSocket, fallback to polling
          upgrade: true,
          reconnection: true,
          reconnectionDelay: 1000, // Start with 1 second
          reconnectionDelayMax: 5000, // Max 5 seconds between reconnection attempts
          reconnectionAttempts: Infinity, // Keep trying to reconnect
          timeout: 10000, // Reduced timeout to 10 seconds
          // Add origin header for multi-tenant support
          extraHeaders: {
            "x-origin": window.location.origin,
          },
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
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return { socket, isConnected, connectionError };
}
