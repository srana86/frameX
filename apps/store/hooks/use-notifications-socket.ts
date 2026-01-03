"use client";

import { useEffect, useCallback } from "react";
import { useSocket } from "./use-socket";
import type { Socket } from "socket.io-client";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  link?: string | null;
}

export function useNotificationsSocket(userId: string | null, onNewNotification: (notification: Notification) => void) {
  const { socket, isConnected, connectionError } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !userId) {
      if (connectionError) {
        console.warn("[Notifications Socket] Connection error:", connectionError);
      }
      return;
    }

    // Join user room for notifications
    socket.emit("join-user", userId);

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      console.log("[Socket] New notification received:", notification);
      onNewNotification(notification);
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, isConnected, userId, onNewNotification, connectionError]);

  return { socket, isConnected, connectionError };
}
