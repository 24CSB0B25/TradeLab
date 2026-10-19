import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import marketRoutes from "./routes/marketRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";

import connectDB from "./config/db.js";

dotenv.config();

const app = express();


// Middleware

app.use(cors());
app.use(express.json());


// Routes

app.use("/api/market", marketRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trade", tradeRoutes);
app.use("/api/watchlist", watchlistRoutes);
// Test route

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "TradeLab server is running"
    });
});


// Start server

const PORT = process.env.PORT || 5000;

const startServer = async () => {

    await connectDB();

    app.listen(PORT, () => {
        console.log(
            `TradeLab server running on port ${PORT}`
        );
    });

};

startServer();