import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cart.js";
import catalogRoutes from "./routes/catalog.js";
import orderRoutes from "./routes/orders.js";

dotenv.config();

const app = express();

// -------- CONFIG --------
const PORT = process.env.PORT || 5001;
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGO_URL || 
  "mongodb://127.0.0.1:27017/shopdb";

// -------- MIDDLEWARE --------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:5175"
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// -------- ROUTES --------
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "API is running..." });
});

// -------- START SERVER --------
async function start() {
  try {
    mongoose.set("strictQuery", true); // cleaner warnings
    
    await mongoose.connect(MONGO_URI, {
      autoIndex: true, // good for development
    });

    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err?.message || err);
    process.exit(1);
  }
}

start();

// -------- GLOBAL ERROR HANDLERS --------
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});
