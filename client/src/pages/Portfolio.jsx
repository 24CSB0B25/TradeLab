import { useNavigate } from "react-router-dom";

import { useCallback, useEffect, useState } from "react";
import { getPortfolio } from "../services/api";
import useLivePrices from "../hooks/useLivePrices";
import { TRADE_COMPLETED_EVENT } from "../utils/tradeEvents";

const Portfolio = () => {
    const navigate = useNavigate();

    const [portfolio, setPortfolio] = useState([]);
    const [virtualCash, setVirtualCash] = useState(0);
    const [loading, setLoading] = useState(true);

    /*
     * Get portfolio from backend.
     * This gives us the stocks we own.
     */
    const fetchPortfolio = useCallback(async () => {
        try {
            const response = await getPortfolio();

            setPortfolio(response.portfolio || []);
            setVirtualCash(response.virtualCash ?? 0);
        } catch (error) {
            console.error("Portfolio error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPortfolio();
    }, [fetchPortfolio]);

    useEffect(() => {
        window.addEventListener(
            TRADE_COMPLETED_EVENT,
            fetchPortfolio
        );

        return () => {
            window.removeEventListener(
                TRADE_COMPLETED_EVENT,
                fetchPortfolio
            );
        };
    }, [fetchPortfolio]);


    /*
     * Extract instrument keys from portfolio.
     */
    const instrumentKeys = portfolio.map(
        (stock) => stock.instrumentKey
    );


    /*
     * Get live prices every second.
     */
    const {
        prices: priceData,
        loading: priceLoading
    } = useLivePrices(
        instrumentKeys,
        1000
    );


    /*
     * Combine portfolio data
     * with live market prices.
     */
    const updatedPortfolio = portfolio.map(
        (stock) => {

            const priceKey = Object.keys(priceData).find(
                (key) =>
                    key === stock.instrumentKey ||
                    key.endsWith(`:${stock.symbol}`)
            );

            const marketData = priceKey ? priceData[priceKey] : null;

            const currentPrice = marketData?.last_price ?? null;

            const investedValue =
                stock.quantity * stock.averageBuyPrice;

            const currentValue =
                currentPrice !== null
                    ? stock.quantity * currentPrice
                    : null;

            const profitLoss =
                currentValue !== null
                    ? currentValue - investedValue
                    : null;

            const profitLossPercentage =
                profitLoss !== null && investedValue > 0
                    ? (profitLoss / investedValue) * 100
                    : null;

            return {
                ...stock,
                currentPrice,
                investedValue,
                currentValue,
                profitLoss,
                profitLossPercentage
            };
        }
    );

    const totalInvested = updatedPortfolio.reduce(
        (total, stock) => total + stock.investedValue,
        0
    );

    const pricedPortfolio = updatedPortfolio.filter(
        (stock) =>
            stock.currentPrice !== null &&
            Number.isFinite(stock.currentPrice)
    );

    const allPricesAvailable =
        updatedPortfolio.length === pricedPortfolio.length;

    const totalCurrentValue = allPricesAvailable
        ? pricedPortfolio.reduce(
            (total, stock) => total + stock.currentValue,
            0
        )
        : null;

    const totalProfitLoss = totalCurrentValue !== null
        ? totalCurrentValue - totalInvested
        : null;

    const totalProfitLossPercentage =
        totalProfitLoss !== null && totalInvested > 0
            ? (totalProfitLoss / totalInvested) * 100
            : null;

    if (loading) {
        return <h2>Loading portfolio...</h2>;
    }


    return (
        <div className="portfolio-page portfolio-page-redesigned">

            {/* Header */}

            <div className="portfolio-header">

                <div>
                    <h1>
                        My Portfolio
                    </h1>

                    <p>
                        Your paper trading holdings
                    </p>
                </div>

                <div className="live-status portfolio-live-status">
                    <span className="live-dot"></span>
                    Live prices
                </div>

            </div>


            {/* Account Summary */}

            <section className="portfolio-summary">

                {/* Virtual Cash */}

                <div className="summary-card">

                    <span>
                        Virtual Cash
                    </span>

                    <h2>
                        ₹
                        {virtualCash.toLocaleString(
                            "en-IN"
                        )}
                    </h2>

                    <p>
                        Available balance
                    </p>

                </div>


                {/* Total Invested */}

                <div className="summary-card">

                    <span>
                        Total Invested
                    </span>

                    <h2>
                        ₹
                        {totalInvested.toLocaleString(
                            "en-IN",
                            {
                                maximumFractionDigits: 2
                            }
                        )}
                    </h2>

                    <p>
                        Amount invested in stocks
                    </p>

                </div>


                {/* Current Value */}

                <div className="summary-card">

                    <span>
                        Current Value
                    </span>

                    <h2>
                        {totalCurrentValue === null
                            ? "--"
                            : `₹${totalCurrentValue.toLocaleString("en-IN", {
                                maximumFractionDigits: 2
                            })}`}
                    </h2>

                    <p>
                        {allPricesAvailable
                            ? "Current market value"
                            : "Waiting for all stock prices"}
                    </p>

                </div>


                {/* Total P&L */}

                <div className="summary-card">

                    <span>Total P&L</span>

                    <h2
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
                                { maximumFractionDigits: 2 }
                            )}`}
                    </h2>

                    <p
                        className={
                            totalProfitLossPercentage === null
                                ? ""
                                : totalProfitLossPercentage >= 0
                                    ? "positive"
                                    : "negative"
                        }
                    >
                        {totalProfitLossPercentage === null
                            ? "--"
                            : `${totalProfitLossPercentage >= 0 ? "+" : ""}${totalProfitLossPercentage.toFixed(2)}%`}
                    </p>

                </div>

            </section>


            {/* Live Price Status */}

            {priceLoading && (
                <p className="portfolio-updating">
                    Updating prices...
                </p>
            )}


            {/* Holdings */}

            <section className="holdings-section">

                <div className="section-title">

                    <div>
                        <h2>
                            Your Holdings
                        </h2>

                        <p>
                            Current market value and P&L
                        </p>
                    </div>

                    <span className="holdings-count">
                        {updatedPortfolio.length}
                        {" "}
                        {updatedPortfolio.length === 1
                            ? "Stock"
                            : "Stocks"}
                    </span>

                </div>


                {updatedPortfolio.length === 0 ? (

                    <div className="empty-portfolio">

                        <div className="empty-icon">
                            📊
                        </div>

                        <h3>
                            No stocks in your portfolio
                        </h3>

                        <p>
                            Search for a stock and
                            start paper trading.
                        </p>

                    </div>

                ) : (

                    <div className="portfolio-grid">

                        {updatedPortfolio.map(
                            (stock) => (

                                <div
                                    className="portfolio-card portfolio-card-clickable"
                                    key={stock._id}
                                    role="link"
                                    tabIndex={0}
                                    aria-label={`View details for ${stock.symbol} - ${stock.name}`}
                                    onClick={() => {
                                        if (!stock.instrumentKey) {
                                            console.error(`Missing instrumentKey for ${stock.symbol}`);
                                            return;
                                        }
                                        navigate(
                                            `/stock/${encodeURIComponent(stock.instrumentKey)}`,
                                            {
                                                state: {
                                                    symbol: stock.symbol,
                                                    name: stock.name,
                                                },
                                            }
                                        );
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            if (!stock.instrumentKey) {
                                                console.error(`Missing instrumentKey for ${stock.symbol}`);
                                                return;
                                            }
                                            navigate(
                                                `/stock/${encodeURIComponent(stock.instrumentKey)}`,
                                                {
                                                    state: {
                                                        symbol: stock.symbol,
                                                        name: stock.name,
                                                    },
                                                }
                                            );
                                        }
                                    }}
                                >

                                    {/* Stock Header */}

                                    <div className="portfolio-card-header">

                                        <div>

                                            <h2>
                                                {stock.symbol}
                                            </h2>

                                            <p>
                                                {stock.name}
                                            </p>

                                        </div>


                                        <div
                                            className={
                                                stock.profitLoss === null
                                                    ? "pnl"
                                                    : stock.profitLoss >= 0
                                                        ? "pnl positive"
                                                        : "pnl negative"
                                            }
                                        >
                                            <strong>
                                                {stock.profitLoss === null
                                                    ? "--"
                                                    : `${stock.profitLoss >= 0 ? "+" : ""}₹${stock.profitLoss.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            maximumFractionDigits: 2
                                                        }
                                                    )}`}
                                            </strong>

                                            <span>
                                                {stock.profitLossPercentage === null
                                                    ? "--"
                                                    : `${stock.profitLossPercentage >= 0 ? "+" : ""}${stock.profitLossPercentage.toFixed(2)}%`}
                                            </span>
                                        </div>

                                    </div>


                                    {/* Current Price */}

                                    <div className="current-price">

                                        <span>
                                            Current Price
                                        </span>

                                        <strong>
                                            {stock.currentPrice === null
                                                ? "--"
                                                : `₹${stock.currentPrice.toLocaleString("en-IN", {
                                                    maximumFractionDigits: 2
                                                })}`}
                                        </strong>

                                    </div>


                                    {/* Holding Details */}

                                    <div className="holding-details">

                                        <div>
                                            <span>
                                                Quantity
                                            </span>

                                            <strong>
                                                {stock.quantity}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Avg. Buy Price
                                            </span>

                                            <strong>
                                                ₹
                                                {stock.averageBuyPrice.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Invested Value
                                            </span>

                                            <strong>
                                                ₹
                                                {stock.investedValue.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Current Value
                                            </span>

                                            <strong>
                                                {stock.currentValue === null
                                                    ? "--"
                                                    : `₹${stock.currentValue.toLocaleString("en-IN", {
                                                        maximumFractionDigits: 2
                                                    })}`}
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </section>

        </div>
    );
};

export default Portfolio;