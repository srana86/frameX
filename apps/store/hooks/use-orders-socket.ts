"use client";

import { useEffect } from "react";
import { useSocket } from "./use-socket";
import type { Order } from "@/lib/types";

export function useOrdersSocket(merchantId: string | null, onNewOrder: (order: Order) => void, onOrderUpdate?: (order: Order) => void) {
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

    if (!merchantId) {
      console.log("[Orders Socket] Merchant ID not available yet");
      return;
    }

    console.log(`[Orders Socket] Joining merchant room: merchant:${merchantId}`);

    // Join merchant room for order updates
    socket.emit("join-merchant", merchantId, (response?: any) => {
      if (response) {
        console.log("[Orders Socket] Join response:", response);
      } else {
        console.log("[Orders Socket] Successfully joined merchant room");
      }
    });

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
    console.log(`[Orders Socket] Listening for orders on merchant:${merchantId}, connected: ${isConnected}`);

    return () => {
      console.log(`[Orders Socket] Cleaning up listener for merchant:${merchantId}`);
      socket.off("new-order", handleOrderEvent);
    };
  }, [socket, isConnected, merchantId, onNewOrder, onOrderUpdate, connectionError]);

  return { socket, isConnected, connectionError };
}
