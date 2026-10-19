import { useCallback, useEffect, useState } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

import {
    recordPortfolioSnapshot,
    getPortfolioHistory,
} from "../services/api";

import { TRADE_COMPLETED_EVENT } from "../utils/tradeEvents";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

export default function PortfolioPerformance() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchHistory = useCallback(async () => {
        try {
            setError("");

            // Record the current value if the 15-minute interval has elapsed.
            await recordPortfolioSnapshot();

            const response = await getPortfolioHistory();
            setHistory(response.history ?? []);
        } catch (err) {
            console.error(
                "Portfolio history error:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                    "Unable to load portfolio performance."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();

        window.addEventListener(
            TRADE_COMPLETED_EVENT,
            fetchHistory
        );

        return () => {
            window.removeEventListener(
                TRADE_COMPLETED_EVENT,
                fetchHistory
            );
        };
    }, [fetchHistory]);

    if (loading) {
        return (
            <section className="portfolio-performance">
                <h2>Portfolio Performance</h2>
                <p>Loading portfolio history...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="portfolio-performance">
                <h2>Portfolio Performance</h2>
                <p className="performance-error">{error}</p>
                <button onClick={fetchHistory}>
                    Retry
                </button>
            </section>
        );
    }

    const chartData = history.map((snapshot) => ({
        ...snapshot,
        timestamp: new Date(snapshot.createdAt).getTime(),
    }));

    return (
        <section className="portfolio-performance">
            <h2>Portfolio Performance</h2>

            <p className="performance-subtitle">
                Your paper-trading account value over time
            </p>

            {chartData.length === 0 ? (
                <p>
                    No portfolio history available yet. Your first
                    snapshot will appear here when one is recorded.
                </p>
            ) : (
                <>
                    <div className="performance-summary">
                        <span>Latest Account Value</span>
                        <strong>
                            {formatCurrency(
                                chartData[chartData.length - 1].totalValue
                            )}
                        </strong>
                    </div>

                    {chartData.length === 1 && (
                        <p className="performance-note">
                            One snapshot recorded. More data points
                            are needed to display a trend.
                        </p>
                    )}

                    <div className="performance-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 10,
                                    bottom: 10,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="timestamp"
                                    type="number"
                                    scale="time"
                                    domain={["dataMin", "dataMax"]}
                                    tickFormatter={(value) =>
                                        formatDate(value)
                                    }
                                    minTickGap={30}
                                />

                                <YAxis
                                    tickFormatter={(value) =>
                                        `₹${Number(value).toLocaleString(
                                            "en-IN"
                                        )}`
                                    }
                                    width={90}
                                />

                                <Tooltip
                                    labelFormatter={(value) =>
                                        formatDate(value)
                                    }
                                    formatter={(value, name) => [
                                        formatCurrency(value),
                                        name === "totalValue"
                                            ? "Total Account Value"
                                            : name,
                                    ]}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="totalValue"
                                    name="Total Account Value"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={chartData.length <= 20}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </section>
    );
}