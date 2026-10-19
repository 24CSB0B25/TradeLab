import express from "express";

import {
    buyStock,
    sellStock,
    getPortfolio,
    getTransactions,
    getTradingAnalytics
} from "../controllers/tradeController.js";

import protect from "../middleware/authMiddleware.js";

import {
    recordPortfolioSnapshot,
    getPortfolioHistory,
} from "../controllers/tradeController.js";

const router = express.Router();

// BUY
router.post("/buy", protect, buyStock);

// SELL
router.post("/sell", protect, sellStock);

// PORTFOLIO
router.get("/portfolio", protect, getPortfolio);

// TRANSACTIONS
router.get("/transactions", protect, getTransactions);

// TRADING ANALYTICS
router.get("/analytics", protect, getTradingAnalytics);

router.post("/snapshots", protect, recordPortfolioSnapshot);
router.get("/history", protect, getPortfolioHistory);

export default router;