import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
    getMarketPrices,
    getHistoricalData,
    buyStock,
    sellStock,
    addToWatchlist,
    getWatchlist,
    removeFromWatchlist,
    getPortfolio
} from "../services/api";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

import { notifyTradeCompleted } from "../utils/tradeEvents";

import StockPriceChart from "../components/StockPriceChart";

const StockDetails = () => {

    const { instrumentKey } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [stockData, setStockData] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [quantity, setQuantity] = useState(1);
    const [tradeLoading, setTradeLoading] = useState(false);
    const [tradeMessage, setTradeMessage] = useState("");
    const [tradeMessageType, setTradeMessageType] = useState("");
    const [lastTrade, setLastTrade] = useState(null);

    const [virtualCash, setVirtualCash] = useState(null);
    const [cashLoading, setCashLoading] = useState(true);

    const [watchlisted, setWatchlisted] = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);

    const loadStockData = async () => {

        try {

            setLoading(true);
            setError("");

            // Decode the instrument key from URL
            const decodedKey =
                decodeURIComponent(instrumentKey);

            console.log("Instrument Key:", decodedKey);

            // Call backend
            const response =
                await getMarketPrices([decodedKey]);

            console.log("API Response:", response);

            // Get Upstox data
            const data =
                response.data?.data || {};

            console.log("Stock Data Object:", data);

            // Get the first stock returned by Upstox
            const stock =
                Object.values(data)[0];

            console.log("Selected Stock:", stock);

            if (!stock) {
                setError("Stock data not available.");
                return;
            }

            setStockData(stock);

            const historyResponse = await getHistoricalData(
    decodedKey
);

            console.log(
                "Historical API Response:",
                historyResponse
            );

            const candles =
                historyResponse.data?.data?.candles || [];

            console.log("Candles:", candles);

            const formattedCandles = candles
                .map((candle) => ({
                    date: new Date(candle[0]).toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short"
                        }
                    ),
                    timestamp: candle[0],
                    open: candle[1],
                    high: candle[2],
                    low: candle[3],
                    close: candle[4],
                    volume: candle[5],
                    openInterest: candle[6]
                }))
                .reverse();

            console.log(
                "Formatted Historical Data:",
                formattedCandles
            );

            setHistoricalData(formattedCandles);

        } catch (err) {

            console.error(
                "Stock details error:",
                err
            );

            setError(
                "Unable to load stock data."
            );

        } finally {

            setLoading(false);

        }
    };

    const loadWatchlistStatus = async () => {
        try {
            const response = await getWatchlist();

            const watchlist = response.watchlist || [];

            const decodedKey = decodeURIComponent(instrumentKey);

            const exists = watchlist.some(
                (stock) => stock.instrumentKey === decodedKey
            );

            setWatchlisted(exists);

        } catch (error) {
            console.error("Watchlist status error:", error);
        }
    };

    const handleWatchlist = async () => {
        try {
            setWatchlistLoading(true);

            const decodedKey =
                decodeURIComponent(instrumentKey);

            if (watchlisted) {

                await removeFromWatchlist(decodedKey);

                setWatchlisted(false);

            } else {

                await addToWatchlist({
                    instrumentKey: decodedKey,
                    symbol: location.state?.symbol,
                    name: location.state?.name,
                    exchange: location.state?.exchange
                });

                setWatchlisted(true);
            }

        } catch (error) {

            console.error(
                "Watchlist error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to update watchlist"
            );

        } finally {

            setWatchlistLoading(false);

        }
    };

    const loadVirtualCash = async () => {
        try {
            setCashLoading(true);

            const response = await getPortfolio();

            setVirtualCash(response.virtualCash ?? 0);

        } catch (error) {
            console.error(
                "Failed to load virtual cash:",
                error
            );
        } finally {
            setCashLoading(false);
        }
    };

    const handleBuy = async () => {

        const qty = Number(quantity);

        if (!Number.isInteger(qty) || qty <= 0) {
            setTradeMessage("Quantity must be a positive whole number.");
            setTradeMessageType("error");
            setLastTrade(null);
            return;
        }

        const orderValue = qty * stockData.last_price;

        const confirmed = window.confirm(
            `Buy ${qty} share(s) of ${location.state?.symbol}?\n\n` +
            `Price: ₹${stockData.last_price.toLocaleString("en-IN")}\n` +
            `Estimated Total: ₹${orderValue.toLocaleString("en-IN")}`
        );

        if (!confirmed) {
            return;
        }

        try {

            setTradeLoading(true);
            setTradeMessage("");
            setTradeMessageType("");
            setLastTrade(null);

            const decodedKey =
                decodeURIComponent(instrumentKey);

            const response = await buyStock({
                instrumentKey: decodedKey,
                symbol: location.state?.symbol,
                name: location.state?.name,
                quantity: qty
            });

            notifyTradeCompleted();

            setLastTrade({
                symbol: response.transaction.symbol,
                type: response.transaction.type,
                quantity: response.transaction.quantity,
                price: response.transaction.price,
                totalAmount: response.transaction.totalAmount,
                virtualCash: response.virtualCash
            });

            if (response.virtualCash !== undefined) {
                setVirtualCash(response.virtualCash);
            }

            setTradeMessage(
                response.message || "Stock bought successfully!"
            );

            setTradeMessageType("success");

        } catch (err) {

            console.error("Buy error:", err);

            setTradeMessage(
                err.response?.data?.message ||
                "Failed to buy stock."
            );

            setTradeMessageType("error");

        } finally {

            setTradeLoading(false);

        }
    };


    const handleSell = async () => {

        const qty = Number(quantity);

        if (!Number.isInteger(qty) || qty <= 0) {
            setTradeMessage("Quantity must be a positive whole number.");
            return;
        }

        const orderValue = qty * stockData.last_price;

        const confirmed = window.confirm(
            `Sell ${qty} share(s) of ${location.state?.symbol}?\n\n` +
            `Price: ₹${stockData.last_price.toLocaleString("en-IN")}\n` +
            `Estimated Total: ₹${orderValue.toLocaleString("en-IN")}`
        );

        if (!confirmed) {
            return;
        }

        try {

            setTradeLoading(true);
            setTradeMessage("");
            setTradeMessageType("");
            setLastTrade(null);

            const decodedKey =
                decodeURIComponent(instrumentKey);

            const response = await sellStock({
                instrumentKey: decodedKey,
                quantity: qty
            });

            notifyTradeCompleted();
            
            setLastTrade({
                symbol: response.transaction.symbol,
                type: response.transaction.type,
                quantity: response.transaction.quantity,
                price: response.transaction.price,
                totalAmount: response.transaction.totalAmount,
                virtualCash: response.virtualCash
            });

            if (response.virtualCash !== undefined) {
                setVirtualCash(response.virtualCash);
            }

            setTradeMessage(
                response.message || "Stock sold successfully!"
            );

            setTradeMessageType("success");

        } catch (err) {

            console.error("Sell error:", err);

            setTradeMessage(
                err.response?.data?.message ||
                "Failed to sell stock."
            );

            setTradeMessageType("error");

        } finally {

            setTradeLoading(false);

        }
    };

    const loadLivePrice = async () => {
        try {
            const decodedKey =
                decodeURIComponent(instrumentKey);

            const response =
                await getMarketPrices([decodedKey]);

            const data =
                response.data?.data || {};

            const stock =
                Object.values(data)[0];

            if (stock) {
                setStockData(stock);
            }

        } catch (err) {
            console.error(
                "Live price update error:",
                err
            );
        }
    };

    useEffect(() => {
        // Load stock details
        loadStockData();

        // Check whether stock is already in watchlist
        loadWatchlistStatus();

        loadVirtualCash();
        // Update live price every second
        const interval = setInterval(() => {
            loadLivePrice();
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [instrumentKey]);

    if (loading) {

        return (
            <div className="dashboard">
                <p>Loading stock data...</p>
            </div>
        );
    }


    if (error) {

        return (
            <div className="dashboard">

                <button
                    onClick={() => navigate("/dashboard")}
                >
                    ← Back
                </button>

                <p className="error">
                    {error}
                </p>

            </div>
        );
    }


    const price = stockData.last_price;
    const previousClose = stockData.cp;

    const change =
        price - previousClose;

    const changePercent =
        previousClose
            ? (change / previousClose) * 100
            : 0;


    return (
        <div className="stock-details-page">

            {/* Back Button */}

            <button
                className="back-button"
                onClick={() => navigate("/dashboard")}
            >
                ← Back to Dashboard
            </button>


            {/* Stock Header */}

            <section className="stock-header">

                <div className="stock-header-top">

                    <div>
                        <p className="stock-exchange">
                            {location.state?.exchange}
                        </p>

                        <h1>
                            {location.state?.name ||
                                location.state?.symbol}
                        </h1>

                        <p className="stock-symbol">
                            {location.state?.symbol}
                        </p>
                    </div>

                    <button
                        className={
                            watchlisted
                                ? "watchlist-button added"
                                : "watchlist-button"
                        }
                        onClick={handleWatchlist}
                        disabled={watchlistLoading}
                    >
                        {watchlistLoading
                            ? "Updating..."
                            : watchlisted
                                ? "★ Remove from Watchlist"
                                : "☆ Add to Watchlist"}
                    </button>

                </div>

            </section>


            {/* Current Price */}

            <section className="price-section">

                <div className="price-heading">

                    <div>

                        <span className="price-label">
                            Current Price
                        </span>

                        <h2>
                            ₹
                            {price?.toLocaleString(
                                "en-IN"
                            )}
                        </h2>

                    </div>

                    <span className="live-indicator">
                        <span className="live-dot"></span>
                        Live
                    </span>

                </div>


                <p
                    className={
                        change >= 0
                            ? "positive price-change"
                            : "negative price-change"
                    }
                >
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(2)}
                    {" "}
                    (
                    {changePercent.toFixed(2)}
                    %)
                </p>

            </section>


            {/* Stock Statistics */}

            <section className="stock-stats">

                <div>

                    <span>
                        Previous Close
                    </span>

                    <strong>
                        ₹
                        {previousClose?.toLocaleString(
                            "en-IN"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Volume
                    </span>

                    <strong>
                        {stockData.volume?.toLocaleString(
                            "en-IN"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Exchange
                    </span>

                    <strong>
                        {location.state?.exchange}
                    </strong>

                </div>

            </section>

            {/* Real Historical Candlestick Chart */}

            <StockPriceChart
                data={historicalData}
                symbol={
                    location.state?.symbol ||
                    location.state?.name ||
                    "Stock"
                }
            />


            {/* Trading Section */}

            <section className="trade-section">

                <div className="section-heading">

                    <div>

                        <h2>
                            Trade
                        </h2>

                        <p>
                            Paper trading
                        </p>

                    </div>

                </div>

                <div className="available-cash">
                    <span>Available Virtual Cash</span>

                    <strong>
                        {cashLoading
                            ? "Loading..."
                            : virtualCash === null
                                ? "Unavailable"
                                : `₹${virtualCash.toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }
                                )}`}
                    </strong>
                </div>

                <div className="quantity-section">

                    <label>
                        Quantity
                    </label>

                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) =>
                            setQuantity(e.target.value)
                        }
                        disabled={tradeLoading}
                    />

                    <div className="order-summary">

                        <div>
                            <span>Current Price</span>

                            <strong>
                                ₹
                                {price.toLocaleString("en-IN")}
                            </strong>
                        </div>

                        <div>
                            <span>Estimated Total</span>

                            <strong>
                                ₹
                                {(
                                    Number(quantity || 0) * price
                                ).toLocaleString(
                                    "en-IN",
                                    {
                                        maximumFractionDigits: 2
                                    }
                                )}
                            </strong>
                        </div>

                    </div>


                </div>


                <div className="trading-actions">
                    <button
                        className="buy-button"
                        onClick={handleBuy}
                        disabled={tradeLoading}
                    >
                        {tradeLoading ? "Processing..." : "BUY"}
                    </button>

                    <button
                        className="sell-button"
                        onClick={handleSell}
                        disabled={tradeLoading}
                    >
                        {tradeLoading ? "Processing..." : "SELL"}
                    </button>
                </div>

                {tradeMessage && (
                    <div
                        className={`trade-message ${tradeMessageType}`}
                        role="status"
                        aria-live="polite"
                    >
                        <p>{tradeMessage}</p>

                        {tradeMessageType === "success" && (
                            <button
                                type="button"
                                onClick={() => navigate("/portfolio")}
                            >
                                View Portfolio →
                            </button>
                        )}
                    </div>
                )}

                {lastTrade && (
                    <div className="trade-confirmation">
                        <h3>
                            {lastTrade.type === "BUY"
                                ? "Purchase Successful"
                                : "Sale Successful"}
                        </h3>

                        <div className="trade-confirmation-row">
                            <span>Stock</span>
                            <strong>{lastTrade.symbol}</strong>
                        </div>

                        <div className="trade-confirmation-row">
                            <span>Transaction Type</span>
                            <strong>{lastTrade.type}</strong>
                        </div>

                        <div className="trade-confirmation-row">
                            <span>Quantity</span>
                            <strong>{lastTrade.quantity}</strong>
                        </div>

                        <div className="trade-confirmation-row">
                            <span>Execution Price</span>
                            <strong>
                                ₹{lastTrade.price.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </strong>
                        </div>

                        <div className="trade-confirmation-row">
                            <span>Total Amount</span>
                            <strong>
                                ₹{lastTrade.totalAmount.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </strong>
                        </div>

                        <div className="trade-confirmation-row">
                            <span>Remaining Virtual Cash</span>
                            <strong>
                                ₹{lastTrade.virtualCash.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </strong>
                        </div>

                        <div className="trade-confirmation-actions">
                            <button
                                type="button"
                                onClick={() => navigate("/portfolio")}
                            >
                                View Portfolio →
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/transactions")}
                            >
                                Transaction History →
                            </button>
                        </div>
                    </div>
                )}

            </section>

        </div>
    );
};

export default StockDetails;