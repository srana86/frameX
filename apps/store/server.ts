import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.IO with dynamic CORS
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: (origin, callback) => {
        // Allow all origins in development
        if (dev) {
          return callback(null, true);
        }

        // In production, allow requests from any origin (multi-tenant)
        // Each merchant can have their own domain
        // You can add domain validation here if needed
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Store io instance globally
  (global as any).io = io;

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-merchant", (merchantId: string) => {
      socket.join(`merchant:${merchantId}`);
      console.log(`Socket ${socket.id} joined merchant:${merchantId}`);
    });

    socket.on("join-user", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined user:${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err: NodeJS.ErrnoException) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server initialized at /api/socket`);
      console.log(`> Make sure to use 'npm run dev' (which uses this custom server) for Socket.IO to work`);
    });
});
