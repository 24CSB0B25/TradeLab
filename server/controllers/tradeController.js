import User from "../models/User.js";
import Portfolio from "../models/Portfolio.js";
import Transaction from "../models/Transaction.js";
import { getLivePrice } from "../services/upstoxService.js";
import PortfolioSnapshot from "../models/PortfolioSnapshot.js";

// =====================================
// BUY STOCK
// =====================================

export const buyStock = async (req, res) => {
    try {
        const { instrumentKey, symbol, name, quantity } = req.body;
        const qty = Number(quantity);

        // Validate input
        if (!instrumentKey || !symbol || !name || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "All stock details are required"
            });
        }

        if (!Number.isInteger(qty) || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive whole number"
            });
        }

        // Get live stock price
        const livePriceResponse = await getLivePrice(instrumentKey);
        const stockData = Object.values(livePriceResponse.data || {})[0];
        const price = stockData?.last_price;

        if (price == null || !Number.isFinite(Number(price)) || Number(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Unable to fetch current stock price"
            });
        }

        const currentPrice = Number(price);

        // Find user
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Calculate purchase amount
        const totalAmount = qty * currentPrice;

        // Check virtual cash
        if (user.virtualCash < totalAmount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient virtual cash"
            });
        }

        // Find existing holding
        let portfolio = await Portfolio.findOne({
            user: user._id,
            instrumentKey
        });

        if (portfolio) {
            // Update weighted-average purchase price
            const oldInvestment =
                portfolio.quantity * portfolio.averageBuyPrice;

            const newInvestment = qty * currentPrice;
            const totalQuantity = portfolio.quantity + qty;

            portfolio.averageBuyPrice =
                (oldInvestment + newInvestment) / totalQuantity;

            portfolio.quantity = totalQuantity;

            await portfolio.save();
        } else {
            // Create a new holding
            portfolio = await Portfolio.create({
                user: user._id,
                instrumentKey,
                symbol,
                name,
                quantity: qty,
                averageBuyPrice: currentPrice
            });
        }

        // Deduct virtual cash
        user.virtualCash -= totalAmount;
        await user.save();

        // Record BUY transaction
        const transaction = await Transaction.create({
            user: user._id,
            instrumentKey,
            symbol,
            name,
            type: "BUY",
            quantity: qty,
            price: currentPrice,
            totalAmount
        });

        return res.status(201).json({
            success: true,
            message: "Stock purchased successfully",
            virtualCash: user.virtualCash,
            portfolio,
            transaction
        });
    } catch (error) {
        console.error("Buy Stock Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to buy stock",
            error: error.message
        });
    }
};


// =====================================
// SELL STOCK
// =====================================

export const sellStock = async (req, res) => {
    try {

        const {
            instrumentKey,
            quantity
        } = req.body;

        const qty = Number(quantity);


        // =====================================
        // VALIDATE INPUT
        // =====================================

        if (
            !instrumentKey ||
            quantity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Instrument key and quantity are required"
            });
        }


        if (
            !Number.isInteger(qty) ||
            qty <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a positive whole number"
            });
        }


        // =====================================
        // GET LIVE STOCK PRICE
        // =====================================

        const livePriceResponse =
            await getLivePrice(instrumentKey);

        const stockData =
            Object.values(
                livePriceResponse.data || {}
            )[0];

        const price = stockData?.last_price;


        if (!price) {
            return res.status(400).json({
                success: false,
                message:
                    "Unable to fetch current stock price"
            });
        }


        // =====================================
        // FIND USER
        // =====================================

        const user = await User.findById(req.user.userId);


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // =====================================
        // FIND PORTFOLIO HOLDING
        // =====================================

        const portfolio =
            await Portfolio.findOne({
                user: user._id,
                instrumentKey
            });


        if (!portfolio) {
            return res.status(400).json({
                success: false,
                message:
                    "You do not own this stock"
            });
        }


        // =====================================
        // CHECK QUANTITY
        // =====================================

        if (portfolio.quantity < qty) {
            return res.status(400).json({
                success: false,
                message:
                    "Insufficient stock quantity"
            });
        }


        // =====================================
        // SAVE STOCK INFORMATION
        // =====================================

        const symbol = portfolio.symbol;

        const name = portfolio.name;


        // =====================================
        // CALCULATE SALE AMOUNT
        // =====================================

        const totalAmount = qty * price;
        
        // Calculate cost basis using weighted-average purchase price
        const costBasis = qty * portfolio.averageBuyPrice;

        // Calculate realized profit or loss
        const realizedProfitLoss = totalAmount - costBasis;

        // =====================================
        // REDUCE HOLDING
        // =====================================

        portfolio.quantity -= qty;

        const remainingQuantity = portfolio.quantity;

        if (remainingQuantity === 0) {
            await Portfolio.findByIdAndDelete(portfolio._id);
        } else {
            await portfolio.save();
        }


        // =====================================
        // ADD VIRTUAL CASH
        // =====================================

        user.virtualCash +=
            totalAmount;

        await user.save();


        // =====================================
        // CREATE TRANSACTION
        // =====================================

        const transaction = await Transaction.create({
            user: user._id,
            instrumentKey,
            symbol,
            name,
            type: "SELL",
            quantity: qty,
            price,
            totalAmount,
            costBasis,
            realizedProfitLoss
        });


        // =====================================
        // RESPONSE
        // =====================================

        res.status(200).json({
            success: true,
            message: "Stock sold successfully",
            virtualCash: user.virtualCash,
            portfolio:
                remainingQuantity === 0
                    ? null
                    : portfolio,
            transaction
        });

    } catch (error) {

        console.error(
            "Sell Stock Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to sell stock",
            error: error.message
        });
    }
};


// =====================================
// GET PORTFOLIO
// =====================================

export const getPortfolio = async (req, res) => {
    try {

        const user =
            await User.findById(
                req.user.userId
            );


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        const portfolio =
            await Portfolio.find({
                user: user._id
            });


        res.status(200).json({
            success: true,
            virtualCash: user.virtualCash,
            portfolio
        });

    } catch (error) {

        console.error(
            "Get Portfolio Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch portfolio"
        });
    }
};


// =====================================
// GET TRANSACTION HISTORY
// =====================================

export const getTransactions = async (req, res) => {
    try {

        const transactions =
            await Transaction.find({
                user: req.user.userId
            }).sort({
                createdAt: -1
            });


        res.status(200).json({
            success: true,
            transactions
        });

    } catch (error) {

        console.error(
            "Get Transactions Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch transactions"
        });
    }
};

export const getTradingAnalytics = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Fetch the user's transactions and current portfolio.
        const transactions = await Transaction.find({
            user: userId
        });

        const portfolio = await Portfolio.find({
            user: userId
        });

        // Total number of completed trades.
        const totalTrades = transactions.length;

        // Total money spent on BUY transactions.
        const totalPurchases = transactions
            .filter(transaction => transaction.type === "BUY")
            .reduce((sum, transaction) => sum + transaction.totalAmount, 0);

        // Total money received from SELL transactions.
        const totalSaleProceeds = transactions
            .filter(transaction => transaction.type === "SELL")
            .reduce((sum, transaction) => sum + transaction.totalAmount, 0);

        // Realized profit/loss from completed SELL transactions.
        const realizedPnL = transactions
            .filter(transaction => transaction.type === "SELL")
            .reduce(
                (sum, transaction) =>
                    sum + (transaction.realizedProfitLoss ?? 0),
                0
            );

        // Calculate unrealized P&L using current market prices.
        let currentPortfolioValue = 0;
        let totalRemainingCost = 0;

        for (const holding of portfolio) {
            const response = await getLivePrice(holding.instrumentKey);
            const priceData = Object.values(response.data || {})[0];
            const currentPrice = priceData?.last_price;

            if (
                typeof currentPrice !== "number" ||
                !Number.isFinite(currentPrice)
            ) {
                continue;
            }

            currentPortfolioValue += holding.quantity * currentPrice;

            totalRemainingCost +=
                holding.quantity * holding.averageBuyPrice;
        }

        const unrealizedPnL =
            currentPortfolioValue - totalRemainingCost;

        const overallPnL = realizedPnL + unrealizedPnL;

        return res.status(200).json({
            success: true,
            analytics: {
                totalTrades,
                totalPurchases,
                totalSaleProceeds,
                realizedPnL,
                currentPortfolioValue,
                totalRemainingCost,
                unrealizedPnL,
                overallPnL
            }
        });
    } catch (error) {
        console.error("Get Trading Analytics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch trading analytics"
        });
    }
};

// Record a portfolio value snapshot
export const recordPortfolioSnapshot = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const holdings = await Portfolio.find({ user: userId });

        let totalPortfolioValue = 0;

        for (const holding of holdings) {
            const livePriceResponse = await getLivePrice(
                holding.instrumentKey
            );

            const price = Number(
                Object.values(livePriceResponse.data || {})[0]?.last_price
            );

            if (!Number.isFinite(price) || price < 0) {
                throw new Error(
                    `Unable to retrieve a valid price for ${holding.symbol}`
                );
            }

            totalPortfolioValue += holding.quantity * price;
        }

        const virtualCash = Number(user.virtualCash);
        const totalValue = totalPortfolioValue + virtualCash;

        // Record at most one snapshot every 15 minutes per user.
        const latestSnapshot = await PortfolioSnapshot.findOne({
            user: userId,
        }).sort({ createdAt: -1 });

        if (
            latestSnapshot &&
            Date.now() - latestSnapshot.createdAt.getTime() < 15 * 60 * 1000
        ) {
            return res.status(200).json({
                success: true,
                message: "A recent snapshot already exists",
                snapshot: latestSnapshot,
            });
        }

        const snapshot = await PortfolioSnapshot.create({
            user: userId,
            totalPortfolioValue,
            virtualCash,
            totalValue,
        });

        return res.status(201).json({
            success: true,
            snapshot,
        });
    } catch (error) {
        console.error("Record portfolio snapshot error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to record portfolio snapshot",
        });
    }
};


// Retrieve portfolio history
export const getPortfolioHistory = async (req, res) => {
    try {
        const userId = req.user.userId;

        const snapshots = await PortfolioSnapshot.find({
            user: userId,
        })
            .sort({ createdAt: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            history: snapshots,
        });
    } catch (error) {
        console.error("Get portfolio history error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve portfolio history",
        });
    }
};