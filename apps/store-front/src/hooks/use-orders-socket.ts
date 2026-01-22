"use client";

import { useEffect } from "react";
import { useSocket } from "./use-socket";
import type { Order } from "@/lib/types";

export function useOrdersSocket(tenantId: string | null, onNewOrder: (order: Order) => void, onOrderUpdate?: (order: Order) => void) {
  const { socket, isConnected, connectionError } = useSocket();

  useEffect(() => {
    if (!socket) {
      console.log("[Orders Socket] Socket not available yet");
      return;
    }

    if (!isConnected) {
      if (connectionError) {
        console.warn("[Orders Socket] Socket not connected:", connectionError);
      } else {
        console.log("[Orders Socket] Socket not connected yet");
      }
      return;
    }

    if (!tenantId) {
      console.log("[Orders Socket] Tenant ID not available yet");
      return;
    }

    console.log(`[Orders Socket] Joining tenant room: tenant:${tenantId}`);

    // Join tenant room for order updates
    socket.emit("user:join-tenant", tenantId);
    console.log("[Orders Socket] Emitted user:join-tenant");

    // Listen for new orders and order updates
    // Both events use "new-order" - the handler will determine if it's new or an update
    const handleOrderEvent = (order: Order) => {
      // If onOrderUpdate is provided, use it (for updates)
      // Otherwise, treat as new order
      if (onOrderUpdate) {
        onOrderUpdate(order);
      } else {
        onNewOrder(order);
      }
    };

    socket.on("new-order", handleOrderEvent);

    // Log connection status
    console.log(`[Orders Socket] Listening for orders on tenant:${tenantId}, connected: ${isConnected}`);

    return () => {
      console.log(`[Orders Socket] Cleaning up listener for tenant:${tenantId}`);
      socket.off("new-order", handleOrderEvent);
    };
  }, [socket, isConnected, tenantId, onNewOrder, onOrderUpdate, connectionError]);

  return { socket, isConnected, connectionError };
}
