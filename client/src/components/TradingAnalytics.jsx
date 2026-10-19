import { useEffect, useState } from "react";
import { getTradingAnalytics } from "../services/api";
import { TRADE_COMPLETED_EVENT } from "../utils/tradeEvents";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value ?? 0);

const AnalyticsCard = ({ title, value, positiveNegative = false }) => {
    const isPositive = value >= 0;

    return (
        <div className="analytics-card">
            <p className="analytics-title">{title}</p>

            <h3
                className={
                    positiveNegative
                        ? isPositive
                            ? "analytics-value positive"
                            : "analytics-value negative"
                        : "analytics-value"
                }
            >
                {formatCurrency(value)}
            </h3>
        </div>
    );
};

export default function TradingAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchAnalytics = async () => {
            try {
                setError("");

                const data = await getTradingAnalytics();

                if (!cancelled) {
                    setAnalytics(data.analytics);
                }
            } catch (err) {
                console.error(
                    "Trading analytics error:",
                    err.response?.data || err.message
                );

                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load trading analytics."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchAnalytics();

        window.addEventListener(
            TRADE_COMPLETED_EVENT,
            fetchAnalytics
        );

        return () => {
            cancelled = true;

            window.removeEventListener(
                TRADE_COMPLETED_EVENT,
                fetchAnalytics
            );
        };
    }, []);

    if (loading) {
        return <p>Loading trading analytics...</p>;
    }

    if (error) {
        return <p className="analytics-error">{error}</p>;
    }

    if (!analytics) {
        return null;
    }

    return (
        <section className="trading-analytics">
            <h2>Trading Performance</h2>

            <div className="analytics-grid">
                <div className="analytics-card">
                    <p className="analytics-title">Total Trades</p>
                    <h3 className="analytics-value">
                        {analytics.totalTrades}
                    </h3>
                </div>

                <AnalyticsCard
                    title="Total Purchases"
                    value={analytics.totalPurchases}
                />

                <AnalyticsCard
                    title="Sale Proceeds"
                    value={analytics.totalSaleProceeds}
                />

                <AnalyticsCard
                    title="Realized P&L"
                    value={analytics.realizedPnL}
                    positiveNegative
                />

                <AnalyticsCard
                    title="Unrealized P&L"
                    value={analytics.unrealizedPnL}
                    positiveNegative
                />

                <AnalyticsCard
                    title="Overall P&L"
                    value={analytics.overallPnL}
                    positiveNegative
                />
            </div>
        </section>
    );
}