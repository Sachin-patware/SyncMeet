import express from "express";
import { createServer } from "http";
import cors from "cors";
import "dotenv/config";
import path from "path";

// Imports
import connectDB from "./config/db.js";
import authRoutes from "./Routes/auth.js";
import meetingRoutes from "./Routes/meeting.js";
import { initializeSocket } from "./controllers/socketManager.js";
import { allowedOrigins } from "./config/allowedOrigins.js";

const app = express();
const httpServer = createServer(app);

// Render terminates HTTPS at its reverse proxy and forwards client IPs here.
app.set("trust proxy", 1);

// ─── Middleware ────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Socket.io ────────────────────────────────────
initializeSocket(httpServer);

// ─── API Routes ───────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

// ─── Start Server ─────────────────────────────────
const startServer = async () => {
    await connectDB();

    const port = process.env.PORT || 3000;
    httpServer.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
};

startServer();
