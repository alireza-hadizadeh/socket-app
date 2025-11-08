import { Server } from "socket.io";
import { createServer } from "http";
import { initializeDatabase, addMessage, addConnection, addDisconnection, getConnections, getMessages } from "./lib/db/database";

// Initialize database
initializeDatabase();

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:8000", "http://localhost", "http://127.0.0.1:5500"];

      // Allow if origin is in whitelist or if no origin provided (file://)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("file://")) {
        callback(null, true);
      } else {
        // In development, allow all origins
        if (NODE_ENV === "development") {
          callback(null, true);
        } else {
          callback(new Error("CORS not allowed"));
        }
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout: 60000,
});

// Track connected clients
const connectedClients = new Map<string, { userId?: string; platform?: string; connectedAt: number }>();

// Helper function for logging
const log = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`, data ? JSON.stringify(data) : "");
};

// Socket connection handler
io.on("connection", (socket) => {
  const socketId: string = socket.id;
  const connectedAt = Date.now();

  log("INFO", `Client connected`, { socketId, connectedAt });

  connectedClients.set(socketId, { connectedAt });

  // Emit user connected event to all clients
  const connectionData = {
    socketId,
    connectedAt,
    totalConnected: connectedClients.size,
    timestamp: new Date().toISOString(),
  };

  io.emit("user-connected", connectionData);
  addConnection(socketId, "web");
  log("INFO", `User connected event emitted`, connectionData);

  // Handle incoming messages
  socket.on("send-message", (data) => {
    try {
      const message = {
        socketId,
        sender: data.sender || socketId,
        text: data.text,
        platform: data.platform || "web",
        timestamp: new Date().toISOString(),
      };

      log("INFO", `Message received`, { ...message, socketId });

      // Store message in database
      addMessage(socketId, message.sender, message.text, message.platform);

      // Broadcast to all connected clients
      io.emit("receive-message", message);
      log("INFO", `Message broadcasted to ${io.engine.clientsCount} clients`);
    } catch (error) {
      log("ERROR", `Error handling send-message`, { error: String(error), socketId });
      socket.emit("error", { message: "Failed to process message" });
    }
  });

  // Handle custom events
  socket.on("custom-event", (data) => {
    try {
      log("INFO", `Custom event received`, { socketId, eventData: data });

      // Broadcast custom event to all clients
      io.emit("custom-event", {
        from: socketId,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      log("ERROR", `Error handling custom-event`, { error: String(error), socketId });
    }
  });

  // Handle user identification (for Flutter/Laravel apps)
  socket.on("identify", (data) => {
    try {
      const clientInfo = {
        userId: data.userId,
        platform: data.platform || "unknown",
        appVersion: data.appVersion || "unknown",
      };

      connectedClients.set(socketId, { ...connectedClients.get(socketId)!, ...clientInfo });
      log("INFO", `Client identified`, { socketId, ...clientInfo });

      socket.emit("identified", {
        socketId,
        message: "Client identified successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      log("ERROR", `Error handling identify`, { error: String(error), socketId });
    }
  });

  // Handle heartbeat/ping
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: new Date().toISOString() });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    try {
      const clientInfo = connectedClients.get(socketId);
      connectedClients.delete(socketId);
      const connectedDuration = clientInfo?.connectedAt ? Date.now() - clientInfo.connectedAt : 0;

      const disconnectionData = {
        socketId,
        platform: clientInfo?.platform || "unknown",
        connectedDuration: connectedDuration,
        totalConnected: connectedClients.size,
        timestamp: new Date().toISOString(),
      };

      log("INFO", `Client disconnected`, disconnectionData);

      // Store disconnection in database
      addDisconnection(socketId);

      // Emit user disconnected event to all clients
      io.emit("user-disconnected", disconnectionData);
      log("INFO", `User disconnected event emitted`, disconnectionData);
    } catch (error) {
      log("ERROR", `Error handling disconnect`, { error: String(error), socketId });
    }
  });

  // Handle errors
  socket.on("error", (error) => {
    log("ERROR", `Socket error`, { socketId, error: String(error) });
  });
});

// Handle server errors
httpServer.on("error", (error) => {
  log("ERROR", `Server error`, { error: String(error) });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  log("INFO", "SIGTERM received, starting graceful shutdown");
  io.emit("server-shutting-down", { timestamp: new Date().toISOString() });
  httpServer.close(() => {
    log("INFO", "Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  log("INFO", "SIGINT received, starting graceful shutdown");
  io.emit("server-shutting-down", { timestamp: new Date().toISOString() });
  httpServer.close(() => {
    log("INFO", "Server closed");
    process.exit(0);
  });
});

// Start server
httpServer.listen(PORT, () => {
  log("INFO", `Socket.IO server running`, {
    port: PORT,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });

  log("INFO", "Configured CORS origins", {
    origins: ["http://localhost:3000", "http://localhost:8000", "*"],
  });
});

// Periodic status logging
setInterval(() => {
  log("INFO", `Server status`, {
    connectedClients: connectedClients.size,
    timestamp: new Date().toISOString(),
  });
}, 60000); // Log every minute

export default io;
