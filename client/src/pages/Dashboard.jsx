import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import useLivePrices from "../hooks/useLivePrices";
import { MARKET_INDICES } from "../config/marketConfig";
import MarketCard from "../components/MarketCard";
import StockSearch from "../components/StockSearch";
import TradingAnalytics from "../components/TradingAnalytics"
import { getWatchlist, getPortfolio, getHistoricalData } from "../services/api";

import { TRADE_COMPLETED_EVENT } from "../utils/tradeEvents";
import PortfolioPerformance from "../components/PortfolioPerformance";

import DashboardMarketChart from "../components/DashboardMarketChart";

const Dashboard = () => {

    // -----------------------------
    // Selected stock
    // -----------------------------

    const navigate = useNavigate();

    const [selectedStock, setSelectedStock] = useState(null);

    const [watchlist, setWatchlist] = useState([]);
    const [watchlistLoading, setWatchlistLoading] = useState(true);

    const [portfolio, setPortfolio] = useState([]);
    const [virtualCash, setVirtualCash] = useState(0);
    const [portfolioLoading, setPortfolioLoading] = useState(true);

    // -----------------------------
    // Market indices
    // -----------------------------

    const marketKeys = MARKET_INDICES.map(
        (market) => market.key
    );

    const {
        prices: marketData,
        loading: marketLoading
    } = useLivePrices(
        marketKeys,
        1000
    );


    // -----------------------------
    // Selected stock live prices
    // -----------------------------

    const selectedStockKeys = selectedStock
        ? [selectedStock.instrument_key]
        : [];

    const {
        prices: selectedLivePrices,
        loading: selectedLiveLoading
    } = useLivePrices(
        selectedStockKeys,
        1000
    );


    // -----------------------------
    // When user selects a stock
    // -----------------------------

    const handleStockSelect = (stock) => {

        console.log("Selected stock:", stock);

        setSelectedStock(stock);
    };

    useEffect(() => {

        const fetchWatchlist = async () => {

            try {

                const response = await getWatchlist();

                setWatchlist(
                    response.watchlist || []
                );

            } catch (error) {

                console.error(
                    "Dashboard watchlist error:",
                    error
                );

            } finally {

                setWatchlistLoading(false);

            }

        };

        fetchWatchlist();

    }, []);

    const fetchPortfolio = useCallback(async () => {
        try {
            const response = await getPortfolio();

            setPortfolio(response.portfolio || []);
            setVirtualCash(response.virtualCash ?? 0);
        } catch (error) {
            console.error("Dashboard portfolio error:", error);
        } finally {
            setPortfolioLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPortfolio();
    }, [fetchPortfolio]);

    useEffect(() => {
        const refreshPortfolio = () => {
            fetchPortfolio();
        };

        window.addEventListener("focus", refreshPortfolio);

        window.addEventListener(
            TRADE_COMPLETED_EVENT,
            refreshPortfolio
        );

        return () => {
            window.removeEventListener("focus", refreshPortfolio);

            window.removeEventListener(
                TRADE_COMPLETED_EVENT,
                refreshPortfolio
            );
        };
    }, [fetchPortfolio]);

    const watchlistKeys = watchlist.map(
        (stock) => stock.instrumentKey
    );

    const portfolioKeys = portfolio.map(
        (stock) => stock.instrumentKey
    );

    const {
        prices: watchlistPrices,
        loading: watchlistPricesLoading
    } = useLivePrices(
        watchlistKeys,
        1000
    );

    const {
        prices: portfolioPrices,
        loading: portfolioPricesLoading
    } = useLivePrices(
        portfolioKeys,
        1000
    );

    const totalInvested = portfolio.reduce(
        (total, stock) =>
            total + stock.quantity * stock.averageBuyPrice,
        0
    );

    const pricedPortfolio = portfolio.map((stock) => {
        const priceKey = Object.keys(portfolioPrices).find(
            (key) =>
                key === stock.instrumentKey ||
                key === stock.instrumentKey.replace("|", ":") ||
                key.endsWith(`:${stock.symbol}`)
        );

        const priceData = priceKey
            ? portfolioPrices[priceKey]
            : null;

        const currentPrice = priceData?.last_price;

        return {
            ...stock,
            currentPrice:
                typeof currentPrice === "number" &&
                Number.isFinite(currentPrice)
                    ? currentPrice
                    : null
        };
    });

    const allPricesAvailable =
        pricedPortfolio.length === 0 ||
        pricedPortfolio.every(
            (stock) => stock.currentPrice !== null
        );

    const currentValue = allPricesAvailable
        ? pricedPortfolio.reduce(
            (total, stock) =>
                total + stock.quantity * stock.currentPrice,
            0
        )
        : null;

    const totalProfitLoss =
        currentValue !== null
            ? currentValue - totalInvested
            : null;

    const totalProfitLossPercentage =
        totalProfitLoss !== null && totalInvested > 0
            ? (totalProfitLoss / totalInvested) * 100
            : null;

    const [historicalMarketData, setHistoricalMarketData] = useState([]);
    const [historicalLoading, setHistoricalLoading] = useState(true);
    const [historicalError, setHistoricalError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchHistoricalMarketData = async () => {
            try {
                setHistoricalLoading(true);
                setHistoricalError("");

                const response = await getHistoricalData(
                    "NSE_INDEX|Nifty 50",
                    "days",
                    "1"
                );

                // Support the response wrapper used by your backend.
                const candles =
                    response?.data?.data?.candles ??
                    response?.data?.candles ??
                    response?.data?.data ??
                    [];

                if (!Array.isArray(candles) || candles.length === 0) {
                    throw new Error("No historical market data was returned.");
                }

                // Upstox candle format:
                // [timestamp, open, high, low, close, volume, openInterest]
                const formattedData = candles
                    .map((candle) => ({
                        timestamp: candle[0],
                        close: Number(candle[4])
                    }))
                    .filter(
                        (item) =>
                            item.timestamp &&
                            Number.isFinite(new Date(item.timestamp).getTime()) &&
                            Number.isFinite(item.close)
                    )
                    .sort(
                        (a, b) =>
                            new Date(a.timestamp).getTime() -
                            new Date(b.timestamp).getTime()
                    );

                if (formattedData.length === 0) {
                    throw new Error("Historical data contained no valid price points.");
                }

                if (!cancelled) {
                    setHistoricalMarketData(formattedData);
                }
            } catch (error) {
                console.error("Historical market data error:", error);

                if (!cancelled) {
                    setHistoricalError(
                        "Historical market data is temporarily unavailable."
                    );
                }
            } finally {
                if (!cancelled) {
                    setHistoricalLoading(false);
                }
            }
        };

        fetchHistoricalMarketData();

        return () => {
            cancelled = true;
        };
    }, []);

    return (

        <div className="dashboard">

            {/* Dashboard hero */}
            <header className="dashboard-header dashboard-hero">
                <div className="dashboard-hero-copy">
                    <span className="dashboard-eyebrow">YOUR VIRTUAL TRADING DESK</span>
                    <h1>Indian Markets. <span>Smarter Trades.</span></h1>
                    <p>
                        Explore market movements, discover stocks, and practise your trading
                        strategies — all without risking real money.
                    </p>
                    <div className="dashboard-hero-actions">
                        <button
                            className="dashboard-primary-action"
                            onClick={() => document.getElementById("market-overview")?.scrollIntoView({ behavior: "smooth" })}
                        >
                            Explore Markets <span aria-hidden="true">↓</span>
                        </button>
                        <button
                            className="dashboard-secondary-action"
                            onClick={() => navigate("/portfolio")}
                        >
                            View Portfolio <span aria-hidden="true">↗</span>
                        </button>
                    </div>
                </div>
                <div className="dashboard-hero-art" aria-hidden="true">
                    <div className="hero-orbit hero-orbit-one" />
                    <div className="hero-orbit hero-orbit-two" />
                    <div className="hero-chart-card">
                        <span className="hero-chart-label">MARKET MOMENTUM</span>
                        <svg viewBox="0 0 320 110" role="presentation">
                            <defs>
                                <linearGradient id="heroLineGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                                <linearGradient id="heroAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.32" />
                                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0 86 C22 76 26 82 43 63 S75 76 94 51 S124 67 145 40 S176 54 197 28 S228 48 248 22 S286 32 320 5 L320 110 L0 110 Z" fill="url(#heroAreaGradient)" />
                            <path d="M0 86 C22 76 26 82 43 63 S75 76 94 51 S124 67 145 40 S176 54 197 28 S228 48 248 22 S286 32 320 5" fill="none" stroke="url(#heroLineGradient)" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <div className="hero-chart-footer"><span><i /> Paper trading simulator</span><strong>Learn by doing</strong></div>
                    </div>
                </div>
            </header>

            {/* Stock Search */}
            <div className="dashboard-search-wrap">
                <div className="dashboard-search-heading">
                    <h2>Find your next stock</h2>
                    <p>Search by company name or symbol to view stock details.</p>
                </div>
                <StockSearch onStockSelect={handleStockSelect} />
            </div>

            {/* Quick trading snapshot: uses data already loaded by the dashboard */}
            <section className="dashboard-snapshot" aria-label="Trading snapshot">
                <div className="snapshot-heading">
                    <div><span className="dashboard-eyebrow">AT A GLANCE</span><h2>Your Trading Snapshot</h2></div>
                    <span className="snapshot-mode"><i /> Paper Trading Mode</span>
                </div>
                <div className="snapshot-grid">
                    <article className="snapshot-card snapshot-card-violet">
                        <span className="snapshot-icon">▥</span>
                        <div><p>Market Indices</p><strong>{MARKET_INDICES.length}</strong><small>Markets to explore</small></div>
                    </article>
                    <article className="snapshot-card snapshot-card-pink">
                        <span className="snapshot-icon">☆</span>
                        <div><p>Watchlist</p><strong>{watchlistLoading ? "—" : watchlist.length}</strong><small>Stocks you're tracking</small></div>
                    </article>
                    <article className="snapshot-card snapshot-card-blue">
                        <span className="snapshot-icon">▤</span>
                        <div><p>Portfolio Value</p><strong>{portfolioLoading || currentValue === null ? "—" : `₹${currentValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}</strong><small>Current holdings value</small></div>
                    </article>
                    <article className="snapshot-card snapshot-card-teal">
                        <span className="snapshot-icon">✓</span>
                        <div><p>Trading Practice</p><strong>Risk-free</strong><small>Virtual cash, real learning</small></div>
                    </article>
                </div>
            </section>


            {/* Selected Stock */}

            {selectedStock && (

                <section className="selected-stock">

                    <h2>
                        {selectedStock.name}
                    </h2>

                    <p>
                        {selectedStock.exchange}
                        {" • "}
                        {selectedStock.symbol}
                    </p>


                    {selectedLiveLoading && (
                        <p>
                            Loading stock data...
                        </p>
                    )}


                    {!selectedLiveLoading && (
                        Object.values(selectedLivePrices).map(
                            (data) => (

                                <div
                                    key={data.instrument_token}
                                >

                                    <h1>
                                        ₹
                                        {data.last_price?.toLocaleString(
                                            "en-IN"
                                        )}
                                    </h1>

                                    <p>
                                        Previous Close:
                                        {" "}
                                        ₹
                                        {data.cp?.toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>

                                </div>

                            )
                        )
                    )}

                </section>

            )}


            {/* Market Overview */}

            <section id="market-overview" className="dashboard-market-section">

                <div className="section-title">

                    <h2>
                        Market Overview
                    </h2>

                    <p>
                        Live prices update automatically
                    </p>

                </div>


                {marketLoading && (
                    <p>
                        Loading market data...
                    </p>
                )}


                {!marketLoading && (

                    <div className="market-grid">

                        {MARKET_INDICES.map(
                            (market) => {

                                const data =
                                    marketData[
                                        market.key.replace(
                                            "|",
                                            ":"
                                        )
                                    ];

                                return (

                                    <MarketCard
                                        key={market.key}
                                        market={market}
                                        data={data}
                                    />

                                );

                            }
                        )}

                    </div>

                )}

            </section>

            {/* Market Performance Chart */}
            <DashboardMarketChart
                data={historicalMarketData}
                title="NIFTY 50 Market Performance"
                subtitle="Historical daily closing prices"
                symbol="NIFTY 50"
                loading={historicalLoading}
                error={historicalError}
            />

            {/* Watchlist */}

            <section className="dashboard-watchlist">

                <div className="dashboard-watchlist-header">

                    <div>

                        <h2>
                            Your Watchlist
                        </h2>

                        <p>
                            Stocks you're currently tracking
                        </p>

                    </div>


                    <button
                        className="view-watchlist-button"
                        onClick={() => navigate("/watchlist")}
                    >
                        View All →
                    </button>

                </div>


                {/* Loading */}

                {watchlistLoading && (

                    <div className="dashboard-watchlist-empty">

                        <p>
                            Loading watchlist...
                        </p>

                    </div>

                )}


                {/* Empty */}

                {!watchlistLoading &&
                    watchlist.length === 0 && (

                        <div className="dashboard-watchlist-empty">

                            <div className="dashboard-watchlist-icon">
                                ⭐
                            </div>

                            <h3>
                                Your watchlist is empty
                            </h3>

                            <p>
                                Add stocks from the Stock Details
                                page to track them here.
                            </p>

                            <button
                                className="view-watchlist-button"
                                onClick={() => navigate("/watchlist")}
                            >
                                Open Watchlist
                            </button>

                        </div>

                    )}


                {/* Watchlist stocks */}

                {!watchlistLoading &&
                    watchlist.length > 0 && (

                        <div className="dashboard-watchlist-list">

                            {watchlist
                                .slice(0, 5)
                                .map((stock) => {

                                    const priceKey = Object.keys(watchlistPrices).find(
                                        (key) =>
                                            key === stock.instrumentKey ||
                                            key === stock.instrumentKey.replace("|", ":") ||
                                            key === stock.instrumentKey.replace(":", "|") ||
                                            key.includes(stock.symbol)
                                    );

                                    const priceData = priceKey
                                        ? watchlistPrices[priceKey]
                                        : null;

                                    const currentPrice =
                                        priceData?.last_price;

                                    const previousClose =
                                        priceData?.cp;

                                    const change =
                                        currentPrice !== undefined &&
                                        previousClose !== undefined
                                            ? currentPrice - previousClose
                                            : undefined;

                                    const changePercent =
                                        change !== undefined &&
                                        previousClose !== 0
                                            ? (change / previousClose) * 100
                                            : undefined;


                                    return (

                                        <div
                                            className="dashboard-watchlist-row"
                                            key={stock.instrumentKey}
                                            onClick={() =>
                                                navigate(
                                                    `/stock/${encodeURIComponent(
                                                        stock.instrumentKey
                                                    )}`,
                                                    {
                                                        state: {
                                                            symbol:
                                                                stock.symbol,

                                                            name:
                                                                stock.name,

                                                            exchange:
                                                                stock.exchange
                                                        }
                                                    }
                                                )
                                            }
                                        >

                                            {/* Stock */}

                                            <div className="dashboard-watchlist-stock">

                                                <div className="dashboard-watchlist-symbol">
                                                    {stock.symbol}
                                                </div>

                                                <div>

                                                    <strong>
                                                        {stock.symbol}
                                                    </strong>

                                                    <span>
                                                        {stock.name}
                                                    </span>

                                                </div>

                                            </div>


                                            {/* Price */}

                                            <div className="dashboard-watchlist-price">

                                                <span>
                                                    Current Price
                                                </span>

                                                <strong>

                                                    {currentPrice !== undefined

                                                        ? `₹${Number(
                                                            currentPrice
                                                        ).toLocaleString(
                                                            "en-IN",
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2
                                                            }
                                                        )}`

                                                        : watchlistPricesLoading

                                                            ? "Loading..."

                                                            : "—"}

                                                </strong>

                                            </div>


                                            {/* Change */}

                                            <div className="dashboard-watchlist-change">

                                                {change !== undefined ? (

                                                    <strong
                                                        className={
                                                            change >= 0
                                                                ? "positive"
                                                                : "negative"
                                                        }
                                                    >

                                                        {change >= 0
                                                            ? "+"
                                                            : ""}

                                                        {Number(
                                                            change
                                                        ).toFixed(2)}

                                                        {" ("}

                                                        {change >= 0
                                                            ? "+"
                                                            : ""}

                                                        {changePercent.toFixed(
                                                            2
                                                        )}

                                                        %)

                                                    </strong>

                                                ) : (

                                                    <strong>
                                                        —
                                                    </strong>

                                                )}

                                            </div>

                                        </div>

                                    );
                                })}

                        </div>

                    )}

            </section>

            <TradingAnalytics />

            <PortfolioPerformance />
            
            <section className="dashboard-portfolio">

                <div className="dashboard-portfolio-header">

                    <div>
                        <h2>Portfolio Overview</h2>

                        <p>
                            Your paper trading summary
                        </p>
                    </div>

                    <button
                        className="view-portfolio-button"
                        onClick={() =>
                            navigate("/portfolio")
                        }
                    >
                        View Portfolio →
                    </button>

                </div>


                {portfolioLoading ? (

                    <div className="dashboard-portfolio-empty">
                        <p>Loading portfolio...</p>
                    </div>

                ) : (

                    <div className="dashboard-portfolio-grid">

                        {/* Virtual Cash */}

                        <div className="dashboard-portfolio-card">

                            <span>
                                Virtual Cash
                            </span>

                            <strong>
                                ₹
                                {Number(
                                    virtualCash
                                ).toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }
                                )}
                            </strong>

                        </div>


                        {/* Total Invested */}

                        <div className="dashboard-portfolio-card">

                            <span>
                                Total Invested
                            </span>

                            <strong>
                                ₹
                                {Number(
                                    totalInvested
                                ).toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }
                                )}
                            </strong>

                        </div>


                        {/* Current Value */}

                        <div className="dashboard-portfolio-card">

                            <span>
                                Current Value
                            </span>

                            <strong>
                                {currentValue === null
                                    ? "--"
                                    : `₹${currentValue.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}`}
                            </strong>

                        </div>


                        {/* P&L */}

                        <div className="dashboard-portfolio-card">

                            <span>
                                Total P&L
                            </span>

                            <strong
                                className={
                                    totalProfitLoss === null
                                        ? ""
                                        : totalProfitLoss >= 0
                                            ? "positive"
                                            : "negative"
                                }
                            >
                                {totalProfitLoss === null
                                    ? "--"
                                    : `${totalProfitLoss >= 0 ? "+" : ""}₹${totalProfitLoss.toLocaleString(
                                        "en-IN",
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }
                                    )} (${totalProfitLossPercentage >= 0 ? "+" : ""}${totalProfitLossPercentage.toFixed(2)}%)`}
                            </strong>

                        </div>

                    </div>

                )}

            </section>

            {/* Quick links for common tasks */}
            <section className="dashboard-start-section">
                <div className="dashboard-extra-heading">
                    <span className="dashboard-eyebrow">MAKE YOUR NEXT MOVE</span>
                    <h2>Get More From TradeLab</h2>
                    <p>Everything you need to explore the market and learn by practising.</p>
                </div>
                <div className="dashboard-start-grid">
                    <button className="dashboard-start-card" onClick={() => document.getElementById("market-overview")?.scrollIntoView({ behavior: "smooth" })}>
                        <span className="start-card-icon start-icon-violet">↗</span>
                        <span className="start-card-title">Explore Markets</span>
                        <span className="start-card-description">Compare major indices and keep an eye on market movements.</span>
                        <span className="start-card-link">View market overview <b>→</b></span>
                    </button>
                    <button className="dashboard-start-card" onClick={() => navigate("/watchlist")}>
                        <span className="start-card-icon start-icon-pink">☆</span>
                        <span className="start-card-title">Track Your Stocks</span>
                        <span className="start-card-description">Keep your favourite companies together in one watchlist.</span>
                        <span className="start-card-link">Open watchlist <b>→</b></span>
                    </button>
                    <button className="dashboard-start-card" onClick={() => navigate("/portfolio")}>
                        <span className="start-card-icon start-icon-blue">▤</span>
                        <span className="start-card-title">Practise Trading</span>
                        <span className="start-card-description">Review holdings, virtual cash, and your portfolio performance.</span>
                        <span className="start-card-link">View portfolio <b>→</b></span>
                    </button>
                </div>
            </section>

            <section className="dashboard-learning-section">
                <div className="dashboard-extra-heading">
                    <span className="dashboard-eyebrow">MARKET BASICS</span>
                    <h2>Know What You're Watching</h2>
                    <p>A quick guide to the indices shown in your dashboard.</p>
                </div>
                <div className="dashboard-learning-grid">
                    <article className="dashboard-learning-card"><span>NSE</span><h3>NIFTY 50</h3><p>Represents 50 major companies listed on the National Stock Exchange of India.</p></article>
                    <article className="dashboard-learning-card"><span>BSE</span><h3>SENSEX</h3><p>Tracks 30 major companies listed on the Bombay Stock Exchange.</p></article>
                    <article className="dashboard-learning-card"><span>VOLATILITY</span><h3>INDIA VIX</h3><p>Reflects expected near-term market volatility; it is not a direct measure of market direction.</p></article>
                </div>
            </section>

        </div>
    );
};

export default Dashboard;