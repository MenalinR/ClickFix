const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const os = require("os");
const path = require("path");
const { connectDB, initializeDatabase, checkDatabaseHealth } = require("./db");

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    // Set proper headers for images/PDFs
    setHeaders: (res, filepath) => {
      if (filepath.endsWith(".pdf")) {
        res.set("Content-Type", "application/pdf");
      }
    },
  }),
);

// Connect to Database
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize database collections and indexes
    await initializeDatabase();

    // Check database health
    await checkDatabaseHealth();
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Socket.io for real-time chat
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on("send-message", (data) => {
    io.to(data.chatId).emit("receive-message", data);
  });

  socket.on("typing", (data) => {
    socket.to(data.chatId).emit("user-typing", data);
  });

  // --- Live job tracking ---
  // Customer (or worker) joins a per-job room to receive live location pings.
  socket.on("join-job-tracking", (jobId) => {
    if (jobId) socket.join(`track:${jobId}`);
  });

  socket.on("leave-job-tracking", (jobId) => {
    if (jobId) socket.leave(`track:${jobId}`);
  });

  // Worker streams its position. We relay every ping live to everyone in the
  // room, but only persist to the DB every PERSIST_INTERVAL ms so a customer
  // who opens the screen late still sees the last known position.
  socket.on("worker-location-update", async (data) => {
    const { jobId, coords, phase } = data || {};
    if (!jobId || !coords) return;

    io.to(`track:${jobId}`).emit("worker-location", {
      jobId,
      coords,
      phase,
      at: Date.now(),
    });

    try {
      const now = Date.now();
      const last = lastLocationPersist.get(jobId) || 0;
      if (now - last >= PERSIST_INTERVAL) {
        lastLocationPersist.set(jobId, now);
        const Job = require("./models/Job");
        await Job.findByIdAndUpdate(jobId, {
          workerLiveLocation: {
            coordinates: [coords.longitude, coords.latitude],
            heading: coords.heading,
            speed: coords.speed,
            phase,
            updatedAt: new Date(),
          },
        });
      }
    } catch (e) {
      // non-fatal — live relay already happened
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Throttle DB writes for live location (relay stays real-time).
const PERSIST_INTERVAL = 12000;
const lastLocationPersist = new Map();

// Make io accessible to routes
app.set("io", io);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/workers", require("./routes/workers"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/hardware", require("./routes/hardware"));
app.use("/api/hardwareShop", require("./routes/hardwareShop"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/complaints", require("./routes/complaints"));

const errorHandler = require("./middleware/error");

// Health check route
app.get("/api/health", (req, res) => {
  const Job = require("./models/Job");
  const serviceTypeEnum = Job.schema.path("serviceType").enumValues;
  res.json({
    status: "OK",
    message: "ClickFix API is running",
    timestamp: new Date().toISOString(),
    debug: { serviceTypeEnum },
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

const PORT = process.env.PORT || 5000;

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const ifaceName of Object.keys(interfaces)) {
    for (const iface of interfaces[ifaceName] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
};

// Start server
startServer()
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      const localIP = getLocalIP();
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 API URL: http://0.0.0.0:${PORT}/api`);
      console.log(`📱 Mobile API URL: http://${localIP}:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error("❌ Server startup failed:", err.message);
    process.exit(1);
  });
