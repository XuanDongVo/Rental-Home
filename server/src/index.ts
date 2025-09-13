import { authMiddleware } from "./middleware/authMiddleware";
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Load environment-specific .env file
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: envFile });

/* ROUTE IMPORT */
import tenantRoutes from "./routes/tenantRoutes";
import managerRoutes from "./routes/managerRoutes";
import propertyRoutes from "./routes/propertyRoutes";
// import leaseRoutes from "./routes/leaseRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import terminationPolicyRoutes from "./routes/terminationPolicyRoutes";
import terminationRequestRoutes from "./routes/terminationRequestRoutes";
import { initializeScheduledTasks } from "./services/scheduledTasks";
import chatRoutes from "./routes/chatRoutes";
import { createServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import prisma from "./lib/prisma";

/* CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // bảo vệ tài nguyên tĩnh
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// CORS configuration for SSE with credentials
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: corsOrigin, // Read from environment variable
    credentials: true, // Allow credentials (cookies, auth headers)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  })
);

/* ROUTES */
app.get("/", (req, res) => {
  res.send("This is home route");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", message: "Server is running" });
});

app.use("/applications", applicationRoutes);
app.use("/properties", propertyRoutes);
// app.use("/leases", leaseRoutes);
app.use("/notifications", notificationRoutes);
app.use("/payments", paymentRoutes);
app.use("/termination-policies", terminationPolicyRoutes);
app.use("/termination-requests", terminationRequestRoutes);
app.use("/tenants", authMiddleware(["tenant"]), tenantRoutes);
app.use("/managers", authMiddleware(["manager"]), managerRoutes);
app.use("/chat", chatRoutes);

/* SERVER + SOCKET.IO */
const port = Number(process.env.PORT) || 3002;
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // client should emit 'join' with their userId (cognitoId)
  socket.on("join", (userId: string) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    }
  });

  socket.on("chat:send", async (data: { senderId: string; receiverId: string; content: string }) => {
    try {
      console.log(`Message from ${data.senderId} to ${data.receiverId}: ${data.content}`);
      
      // Use the chat service to save the message
      const { sendMessage } = await import('./services/chatService.js');
      const saved = await sendMessage(data.senderId, data.receiverId, data.content);
      
      // Emit to both sender and receiver
      io.to(data.receiverId).emit("chat:receive", saved);
      io.to(data.senderId).emit("chat:receive", saved);
      
      console.log(`Message sent successfully: ${saved.id}`);
    } catch (error) {
      console.error('Error sending message via socket:', error);
      socket.emit("chat:error", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
  initializeScheduledTasks();
});
