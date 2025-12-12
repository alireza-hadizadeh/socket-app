import { Server } from "socket.io";
import { createServer } from "http";
import { initializeDatabase, addMessage, addConnection, addDisconnection, getConnections, getMessages, updateConnectionUser } from "./lib/db/database";
import { ChannelMessagePayload } from "@/lib/types/ChannelMessagePayload";
import { getApiKeyByKey, updateApiKeyLastUsed, getUserById } from "./lib/db/models/users";

// Initialize database
initializeDatabase();

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = ["http://localhost:3000", "http://localhost:4000", "http://localhost:3001", "http://localhost:8000", "http://localhost", "http://127.0.0.1:5500", "https://service-new-version.test"];

      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("file://")) {
        callback(null, true);
      } else {
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

// Track connected clients with authentication info
const connectedClients = new Map<
  string,
  {
    userId?: string;
    platform?: string;
    connectedAt: number;
    authenticated?: boolean;
    userRole?: string;
    apiKey?: string;
  }
>();

const log = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`, data ? JSON.stringify(data) : "");
};

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const apiKey = socket.handshake.auth.apiKey || socket.handshake.query.apiKey;

    // If no API key provided, allow connection but mark as unauthenticated
    if (!apiKey) {
      log("INFO", "Client connecting without authentication", { socketId: socket.id });
      return next();
    }

    // Verify API key
    const apiKeyRecord = getApiKeyByKey(apiKey as string);

    if (!apiKeyRecord) {
      log("WARN", "Invalid API key attempt", { socketId: socket.id });
      return next(new Error("Invalid API key"));
    }

    // Get user info
    const user = getUserById(apiKeyRecord.user_id);

    if (!user || !user.is_active) {
      log("WARN", "Inactive user attempted connection", { socketId: socket.id, userId: apiKeyRecord.user_id });
      return next(new Error("User account inactive"));
    }

    // Update API key last used
    updateApiKeyLastUsed(apiKey as string);

    // Store auth info in socket
    socket.data.authenticated = true;
    socket.data.userId = user.id;
    socket.data.userRole = user.role;
    socket.data.username = user.username;
    socket.data.apiKey = apiKey;

    log("INFO", "Client authenticated successfully", {
      socketId: socket.id,
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    next();
  } catch (error) {
    log("ERROR", "Authentication error", { error: String(error) });
    next(new Error("Authentication failed"));
  }
});

// Socket connection handler
io.on("connection", (socket) => {
  const socketId: string = socket.id;
  const connectedAt = Date.now();
  const authenticated = socket.data.authenticated || false;
  const userId = socket.data.userId;
  const userRole = socket.data.userRole;

  log("INFO", `Client connected`, {
    socketId,
    authenticated,
    userId,
    userRole,
    connectedAt,
  });

  connectedClients.set(socketId, {
    connectedAt,
    authenticated,
    userId,
    userRole,
    apiKey: socket.data.apiKey,
  });

  const connectionData = {
    socketId,
    authenticated,
    userId,
    userRole,
    connectedAt,
    totalConnected: connectedClients.size,
    timestamp: new Date().toISOString(),
  };

  io.emit("user-connected", connectionData);
  addConnection(socketId, "web");

  // Send authentication status to client
  socket.emit("auth-status", {
    authenticated,
    userId,
    username: socket.data.username,
    role: userRole,
  });

  // Handle incoming messages (authenticated only)
  socket.on("send-message", (data) => {
    if (!socket.data.authenticated) {
      socket.emit("error", { message: "Authentication required to send messages" });
      return;
    }

    try {
      const message = {
        socketId,
        sender: socket.data.username || data.sender || socketId,
        text: data.text,
        platform: data.platform || "web",
        timestamp: new Date().toISOString(),
      };

      log("INFO", `Message received`, { ...message, socketId });

      addMessage(socketId, message.sender, message.text, message.platform);
      io.emit("receive-message", message);

      log("INFO", `Message broadcasted to ${io.engine.clientsCount} clients`);
    } catch (error) {
      log("ERROR", `Error handling send-message`, { error: String(error), socketId });
      socket.emit("error", { message: "Failed to process message" });
    }
  });

  socket.on("custom-event", (data) => {
    try {
      log("INFO", `Custom event received`, { socketId, eventData: data });

      io.emit("custom-event", {
        from: socketId,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      log("ERROR", `Error handling custom-event`, { error: String(error), socketId });
    }
  });

  socket.on("identify", (data) => {
    try {
      const clientInfo = {
        userId: data.userId,
        platform: data.platform || "unknown",
        appVersion: data.appVersion || "unknown",
      };

      const currentInfo = connectedClients.get(socketId);
      connectedClients.set(socketId, { ...currentInfo!, ...clientInfo });

      log("LOG", `Update Connection identified`, { socketId, ...clientInfo });
      updateConnectionUser(socketId, clientInfo.userId, clientInfo.platform);

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

  socket.on("ping", () => {
    socket.emit("pong", { timestamp: new Date().toISOString() });
  });

  socket.on("join-channel", (data) => {
    if (!socket.data.authenticated) {
      socket.emit("error", { message: "Authentication required to join channels" });
      return;
    }

    try {
      const channel = data.channel as string;
      const userId = socket.data.username || socket.id;

      if (!channel) return;

      socket.join(channel);

      const totalInChannel = io.sockets.adapter.rooms.get(channel)?.size || 0;

      io.to(channel).emit("user-joined-channel", {
        channel,
        userId,
        totalInChannel,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in join-channel", error);
      socket.emit("error", { message: "Failed to join channel" });
    }
  });

  socket.on("leave-channel", (data) => {
    try {
      const channel = data.channel as string;
      const userId = socket.data.username || socket.id;

      if (!channel) return;

      socket.leave(channel);

      const totalInChannel = io.sockets.adapter.rooms.get(channel)?.size || 0;

      io.to(channel).emit("user-left-channel", {
        channel,
        userId,
        totalInChannel,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in leave-channel", error);
      socket.emit("error", { message: "Failed to leave channel" });
    }
  });

  socket.on("channel-message", (data: ChannelMessagePayload) => {
    if (!socket.data.authenticated) {
      socket.emit("error", { message: "Authentication required to send channel messages" });
      return;
    }

    try {
      if (!data.channel || !data.text) return;

      const message = {
        channel: data.channel,
        sender: socket.data.username || data.sender || socket.id,
        text: data.text,
        platform: data.platform || "web",
        timestamp: new Date().toISOString(),
      };

      log("LOG", `channel-message`, data.channel);

      io.to(data.channel).emit("channel-message-received", {
        ...message,
        socketId: socket.id,
      });
    } catch (error) {
      console.error("Error in channel-message", error);
      socket.emit("error", { message: "Failed to send channel message" });
    }
  });

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

      addDisconnection(socketId);
      io.emit("user-disconnected", disconnectionData);

      log("INFO", `User disconnected event emitted`, disconnectionData);
    } catch (error) {
      log("ERROR", `Error handling disconnect`, { error: String(error), socketId });
    }
  });

  socket.on("error", (error) => {
    log("ERROR", `Socket error`, { socketId, error: String(error) });
  });
});

httpServer.on("error", (error) => {
  log("ERROR", `Server error`, { error: String(error) });
});

process.on("SIGTERM", () => {
  log("INFO", "SIGTERM received, starting graceful shutdown");
  io.emit("server-shutting-down", { timestamp: new Date().toISOString() });
  httpServer.close(() => {
    log("INFO", "Server closed");
    process.exit(0);
  });
});

httpServer.listen(PORT, () => {
  log("INFO", `Socket.IO server running`, {
    port: PORT,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });

  log("INFO", "Configured CORS origins", {
    origins: ["http://localhost:3000", "http://localhost:4000", "http://localhost:8000", "*"],
  });
});

setInterval(() => {
  log("INFO", `Server status`, {
    connectedClients: connectedClients.size,
    timestamp: new Date().toISOString(),
  });
}, 60000);

export default io;
