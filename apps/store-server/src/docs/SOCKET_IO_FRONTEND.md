# Socket.IO Real-Time Integration Guide (Frontend)

Complete guide for integrating Socket.IO real-time features in your frontend application.

## Table of Contents

1. [Installation](#installation)
2. [Connection Setup](#connection-setup)
3. [Authentication](#authentication)
4. [Order Events](#order-events)
5. [Notification Events](#notification-events)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [TypeScript Types](#typescript-types)

---

## Installation

### React/Next.js

```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

### Vue.js

```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

---

## Connection Setup

### Basic Connection

```typescript
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5000", {
  path: "/socket.io",
  auth: {
    token: "your-jwt-token-here", // JWT token from login API
  },
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  timeout: 20000,
});
```

### Connection Configuration Options

| Option                 | Type     | Default                    | Description                                               |
| ---------------------- | -------- | -------------------------- | --------------------------------------------------------- |
| `path`                 | string   | `/socket.io`               | Socket.IO path                                            |
| `auth.token`           | string   | required                   | JWT access token                                          |
| `transports`           | string[] | `['websocket', 'polling']` | Transport methods (websocket preferred, polling fallback) |
| `reconnection`         | boolean  | `true`                     | Enable automatic reconnection                             |
| `reconnectionDelay`    | number   | `1000`                     | Initial delay before reconnection (ms)                    |
| `reconnectionDelayMax` | number   | `5000`                     | Maximum delay between reconnection attempts (ms)          |
| `reconnectionAttempts` | number   | `5`                        | Maximum number of reconnection attempts                   |
| `timeout`              | number   | `20000`                    | Connection timeout (ms)                                   |

---

## Authentication

Socket.IO requires JWT authentication on connection. The token must be included in the `auth.token` field.

### Getting JWT Token

```typescript
// After successful login
const loginResponse = await fetch("/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const { data } = await loginResponse.json();
const token = data.accessToken; // Use this token for socket connection
```

### Reconnection with Token Refresh

```typescript
let socket: Socket;

function connectSocket(token: string) {
  socket = io("http://localhost:5000", {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
  });
}

// Refresh token and reconnect
socket.on("disconnect", async () => {
  // Get new token
  const newToken = await refreshToken();
  if (newToken) {
    socket.auth = { token: newToken };
    socket.connect();
  }
});
```

---

## Connection Events

### Connection Confirmation

```typescript
socket.on("connected", (data) => {
  console.log("Socket connected:", data);
  // {
  //   socketId: string,
  //   userId: string,
  //   role: string,
  //   timestamp: string
  // }
});
```

### Connection Error

```typescript
socket.on("error", (error) => {
  console.error("Socket error:", error);
  // { message: string }
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
  // Handle authentication errors, network issues, etc.
});
```

### Disconnect

```typescript
socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
  // Reasons: 'io server disconnect', 'io client disconnect', 'ping timeout', etc.
});
```

---

## Order Events

### Join Tenant Room (for order updates)

Join a tenant room to receive order updates for that specific tenant.

```typescript
// Join tenant room
socket.emit("order:join-tenant", "tenant-id-123");

// Confirmation
socket.on("order:joined", (data) => {
  console.log("Joined room:", data);
  // { tenantId: string, room: string }
});

// Leave tenant room
socket.emit("order:leave-tenant", "tenant-id-123");
```

### Join User Room (for personal order updates)

```typescript
// Join user room for personal order updates
socket.emit("order:join-user");

// Confirmation
socket.on("order:joined", (data) => {
  console.log("Joined user room:", data);
  // { userId: string, room: string }
});

// Leave user room
socket.emit("order:leave-user");
```

### Receive Order Updates

```typescript
socket.on("order:update", (data) => {
  console.log("Order update received:", data);

  // Data structure:
  // {
  //   type: 'created' | 'updated' | 'deleted',
  //   order: {
  //     id: string,
  //     status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
  //     total: number,
  //     customer: { ... },
  //     items: [ ... ],
  //     // ... full order object
  //   },
  //   timestamp: string (ISO 8601)
  // }

  switch (data.type) {
    case "created":
      handleNewOrder(data.order);
      break;
    case "updated":
      handleOrderUpdate(data.order);
      break;
    case "deleted":
      handleOrderDeleted(data.order);
      break;
  }
});

function handleNewOrder(order: any) {
  // Show notification
  showNotification({
    title: "New Order",
    message: `Order #${order.id.slice(-6)} for ${order.total}`,
    type: "info",
  });

  // Update order list
  addOrderToList(order);

  // Update statistics
  updateOrderStats();
}

function handleOrderUpdate(order: any) {
  // Update order in list
  updateOrderInList(order);

  // Show status change notification
  if (order.status === "shipped") {
    showNotification({
      title: "Order Shipped",
      message: `Order #${order.id.slice(-6)} has been shipped`,
      type: "success",
    });
  }
}
```

---

## Notification Events

### Join User Room (for notifications)

```typescript
// Join user room for personal notifications
socket.emit("user:join");

// Confirmation
socket.on("user:joined", (data) => {
  console.log("Joined user room:", data);
  // { userId: string, role: string }
});
```

### Receive Notifications

```typescript
socket.on("notification:new", (notification) => {
  console.log("New notification:", notification);

  // Notification structure:
  // {
  //   id: string,
  //   title: string,
  //   message: string,
  //   type: 'info' | 'success' | 'warning' | 'error',
  //   data?: any, // Additional data (e.g., { orderId: string })
  //   timestamp: string (ISO 8601)
  // }

  // Show notification toast
  showNotificationToast({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    duration: 5000,
  });

  // Add to notifications list
  addNotificationToList(notification);

  // Update badge count
  incrementNotificationBadge();

  // Handle specific notification types
  if (notification.data?.orderId) {
    // Link to order if orderId present
    handleOrderNotification(notification);
  }
});
```

### Notification Types

| Type      | Description           | Usage               |
| --------- | --------------------- | ------------------- |
| `info`    | Informational message | General updates     |
| `success` | Success message       | Completed actions   |
| `warning` | Warning message       | Important alerts    |
| `error`   | Error message         | Error notifications |

---

## Heartbeat/Ping

The server implements a heartbeat mechanism. You can send pings to keep the connection alive:

```typescript
socket.on("user:pong", (data) => {
  console.log("Pong received:", data);
  // { timestamp: number }
});

// Send ping (optional - handled automatically by socket.io)
socket.emit("user:ping");
```

---

## Error Handling

### Rate Limiting

If you exceed the rate limit (100 events per minute), you'll receive an error:

```typescript
socket.on("error", (error) => {
  if (error.message === "Rate limit exceeded") {
    console.warn("Rate limit exceeded, reducing event frequency");
    // Implement exponential backoff or reduce event frequency
  }
});
```

### Authentication Errors

```typescript
socket.on("connect_error", (error) => {
  if (error.message.includes("Authentication")) {
    console.error("Authentication failed:", error.message);
    // Redirect to login or refresh token
    redirectToLogin();
  }
});
```

### Connection Errors

```typescript
socket.on("disconnect", (reason) => {
  if (reason === "io server disconnect") {
    // Server disconnected (e.g., server restart)
    // Attempt to reconnect
    socket.connect();
  } else if (reason === "ping timeout") {
    // Connection timeout
    console.warn("Connection timeout, attempting reconnection...");
  }
});
```

---

## React Hook Example

```typescript
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  token: string;
  onOrderUpdate?: (data: any) => void;
  onNotification?: (notification: any) => void;
}

export function useSocket(options: UseSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options.token) return;

    const socketInstance = io('http://localhost:5000', {
      path: '/socket.io',
      auth: { token: options.token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    // Connection events
    socketInstance.on('connected', (data) => {
      console.log('Socket connected:', data);
      setConnected(true);
      setError(null);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError(err.message);
      setConnected(false);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setConnected(false);
    });

    // Order events
    socketInstance.on('order:update', (data) => {
      options.onOrderUpdate?.(data);
    });

    // Notification events
    socketInstance.on('notification:new', (notification) => {
      options.onNotification?.(notification);
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      socketInstance.disconnect();
    };
  }, [options.token]);

  const joinTenantRoom = useCallback((tenantId: string) => {
    socket?.emit('order:join-tenant', tenantId);
  }, [socket]);

  const joinUserRoom = useCallback(() => {
    socket?.emit('user:join');
  }, [socket]);

  return {
    socket,
    connected,
    error,
    joinTenantRoom,
    joinUserRoom,
  };
}

// Usage
function OrderDashboard() {
  const { connected, joinTenantRoom } = useSocket({
    token: userToken,
    onOrderUpdate: (data) => {
      console.log('New order:', data);
      // Handle order update
    },
    onNotification: (notification) => {
      console.log('New notification:', notification);
      // Show notification
    },
  });

  useEffect(() => {
    if (connected) {
      joinTenantRoom('tenant-id-123');
    }
  }, [connected, joinTenantRoom]);

  return <div>Order Dashboard</div>;
}
```

---

## Vue.js Composable Example

```typescript
import { ref, onMounted, onUnmounted } from "vue";
import { io, Socket } from "socket.io-client";

export function useSocket(token: string) {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);
  const error = ref<string | null>(null);

  const connect = () => {
    socket.value = io("http://localhost:5000", {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.value.on("connected", () => {
      connected.value = true;
      error.value = null;
    });

    socket.value.on("connect_error", (err) => {
      error.value = err.message;
      connected.value = false;
    });

    socket.value.on("disconnect", () => {
      connected.value = false;
    });
  };

  const joinTenantRoom = (tenantId: string) => {
    socket.value?.emit("order:join-tenant", tenantId);
  };

  const joinUserRoom = () => {
    socket.value?.emit("user:join");
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    socket.value?.disconnect();
  });

  return {
    socket,
    connected,
    error,
    joinTenantRoom,
    joinUserRoom,
  };
}
```

---

## TypeScript Types

Create type definitions for better type safety:

```typescript
// socket.types.ts

export interface SocketConnectionData {
  socketId: string;
  userId: string;
  role: string;
  timestamp: string;
}

export interface OrderUpdateEvent {
  type: "created" | "updated" | "deleted";
  order: Order;
  timestamp: string;
}

export interface Order {
  id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  customer: CustomerInfo;
  items: OrderItem[];
  createdAt: string;
  // ... other order fields
}

export interface NotificationEvent {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  data?: any;
  timestamp: string;
}

export interface CustomerInfo {
  fullName: string;
  email?: string;
  phone: string;
  addressLine1: string;
  // ... other customer fields
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  // ... other item fields
}
```

---

## Best Practices

### 1. Token Management

- Store JWT token securely (httpOnly cookie or secure storage)
- Refresh token before expiration
- Reconnect with new token if authentication fails

### 2. Connection Management

- Connect only when needed (e.g., user is authenticated)
- Disconnect when component unmounts or user logs out
- Handle reconnection gracefully

### 3. Room Management

- Join rooms after successful connection
- Leave rooms when no longer needed
- Rejoin rooms after reconnection

### 4. Event Handling

- Clean up event listeners to prevent memory leaks
- Use typed event handlers for type safety
- Handle errors gracefully

### 5. Performance

- Debounce high-frequency events if needed
- Update UI efficiently (avoid unnecessary re-renders)
- Use React.memo or Vue computed properties for derived state

### 6. Error Handling

- Always handle connection errors
- Show user-friendly error messages
- Implement retry logic with exponential backoff

---

## Environment Configuration

### Development

```typescript
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
```

### Production

```typescript
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "https://api.yourdomain.com";
```

---

## Complete Example (React + TypeScript)

```typescript
import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { OrderUpdateEvent, NotificationEvent } from "./socket.types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export function useRealtimeUpdates(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const socketInstance = io(SOCKET_URL, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on("connected", (data) => {
      console.log("✅ Socket connected:", data);
      setConnected(true);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      setConnected(false);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Disconnected:", reason);
      setConnected(false);
    });

    socketInstance.on("error", (error) => {
      console.error("⚠️ Socket error:", error);
    });

    // Order updates
    socketInstance.on("order:update", (data: OrderUpdateEvent) => {
      console.log("📦 Order update:", data);

      if (data.type === "created") {
        setOrders((prev) => [data.order, ...prev]);
      } else if (data.type === "updated") {
        setOrders((prev) =>
          prev.map((order) => (order.id === data.order.id ? data.order : order))
        );
      } else if (data.type === "deleted") {
        setOrders((prev) => prev.filter((order) => order.id !== data.order.id));
      }
    });

    // Notifications
    socketInstance.on("notification:new", (notification: NotificationEvent) => {
      console.log("🔔 Notification:", notification);
      setNotifications((prev) => [notification, ...prev]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  // Join tenant room
  const joinTenantRoom = useCallback(
    (tenantId: string) => {
      if (socket && connected) {
        socket.emit("order:join-tenant", tenantId);
        socket.on("order:joined", (data) => {
          console.log("✅ Joined tenant room:", data);
        });
      }
    },
    [socket, connected]
  );

  // Join user room
  const joinUserRoom = useCallback(() => {
    if (socket && connected) {
      socket.emit("user:join");
      socket.on("user:joined", (data) => {
        console.log("✅ Joined user room:", data);
      });
    }
  }, [socket, connected]);

  return {
    socket,
    connected,
    orders,
    notifications,
    joinTenantRoom,
    joinUserRoom,
  };
}
```

---

## Troubleshooting

### Connection Fails

1. **Check JWT token**: Ensure token is valid and not expired
2. **Check CORS**: Verify server CORS configuration allows your origin
3. **Check network**: Ensure server is accessible
4. **Check path**: Verify `path: '/socket.io'` matches server configuration

### Events Not Received

1. **Verify room membership**: Ensure you've joined the correct room
2. **Check rate limiting**: You may have exceeded the rate limit
3. **Verify event names**: Event names must match exactly
4. **Check server logs**: Look for errors on the server side

### High Memory Usage

1. **Clean up listeners**: Remove event listeners on component unmount
2. **Disconnect properly**: Always disconnect socket on cleanup
3. **Avoid memory leaks**: Use React.useEffect cleanup or Vue onUnmounted

---

## Support

For issues or questions:

- Check server logs for error messages
- Verify your JWT token is valid
- Ensure you've joined the correct rooms
- Check network connectivity

---

**Last Updated**: See git commit history for latest changes.
