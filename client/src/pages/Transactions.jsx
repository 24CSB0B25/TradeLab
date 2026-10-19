import { useCallback, useEffect, useState } from "react";
import { getTransactions } from "../services/api";
import { TRADE_COMPLETED_EVENT } from "../utils/tradeEvents";

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [filter, setFilter] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("NEWEST");

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getTransactions();

            setTransactions(response.transactions || []);
        } catch (error) {
            console.error("Transactions error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load transactions. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();

        window.addEventListener(
            TRADE_COMPLETED_EVENT,
            fetchTransactions
        );

        return () => {
            window.removeEventListener(
                TRADE_COMPLETED_EVENT,
                fetchTransactions
            );
        };
    }, [fetchTransactions]);

    const filteredTransactions =
        [...transactions]
            .filter((transaction) => {
                if (filter === "ALL") {
                    return true;
                }

                return transaction.type === filter;
            })
            .sort((a, b) => {
                const dateA = new Date(
                    a.createdAt
                ).getTime();

                const dateB = new Date(
                    b.createdAt
                ).getTime();

                return sortOrder === "NEWEST"
                    ? dateB - dateA
                    : dateA - dateB;
            });

    if (loading && transactions.length === 0) {
        return (
            <div className="transactions-page transactions-page-redesigned">
                <h2>Loading transactions...</h2>
                <p>Please wait while we fetch your transaction history.</p>
            </div>
        );
    }

    return (
        <div className="transactions-page transactions-page-redesigned">

            {/* Header */}
            <div className="transactions-header">
                <div>
                    <h1>Transaction History</h1>
                    <p>
                        Track your buying and selling activity
                    </p>
                </div>

                <div className="transactions-header-actions">
                    <div className="transaction-count">
                        {filteredTransactions.length}{" "}
                        {filteredTransactions.length === 1
                            ? "Transaction"
                            : "Transactions"}
                    </div>

                    <button
                        type="button"
                        className="refresh-button"
                        onClick={fetchTransactions}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "↻ Refresh"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="transactions-error" role="alert">
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={fetchTransactions}
                        disabled={loading}
                    >
                        Try Again
                    </button>
                </div>
            )}


            {/* Quick activity summary */}
            <section className="transaction-summary" aria-label="Transaction summary">
                <div className="transaction-summary-card">
                    <span className="summary-mark summary-mark-total">↗</span>
                    <div>
                        <p>Total activity</p>
                        <strong>{transactions.length}</strong>
                        <small>Recorded trades</small>
                    </div>
                </div>
                <div className="transaction-summary-card">
                    <span className="summary-mark summary-mark-buy">＋</span>
                    <div>
                        <p>Buy orders</p>
                        <strong>{transactions.filter((item) => item.type === "BUY").length}</strong>
                        <small>Purchases made</small>
                    </div>
                </div>
                <div className="transaction-summary-card">
                    <span className="summary-mark summary-mark-sell">−</span>
                    <div>
                        <p>Sell orders</p>
                        <strong>{transactions.filter((item) => item.type === "SELL").length}</strong>
                        <small>Positions sold</small>
                    </div>
                </div>
                <div className="transaction-summary-card transaction-summary-volume">
                    <span className="summary-mark summary-mark-volume">₹</span>
                    <div>
                        <p>Traded volume</p>
                        <strong>₹{transactions.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
                        <small>Total transaction value</small>
                    </div>
                </div>
            </section>

            {/* Filters */}
            <div className="transaction-filters">

                <div className="filter-buttons">

                    <button
                        className={
                            filter === "ALL"
                                ? "filter-button active"
                                : "filter-button"
                        }
                        onClick={() => setFilter("ALL")}
                    >
                        All
                    </button>

                    <button
                        className={
                            filter === "BUY"
                                ? "filter-button active"
                                : "filter-button"
                        }
                        onClick={() => setFilter("BUY")}
                    >
                        Buy
                    </button>

                    <button
                        className={
                            filter === "SELL"
                                ? "filter-button active"
                                : "filter-button"
                        }
                        onClick={() => setFilter("SELL")}
                    >
                        Sell
                    </button>

                </div>


                <select
                    className="sort-select"
                    value={sortOrder}
                    onChange={(e) =>
                        setSortOrder(e.target.value)
                    }
                >
                    <option value="NEWEST">
                        Newest First
                    </option>

                    <option value="OLDEST">
                        Oldest First
                    </option>
                </select>

            </div>


            {/* Empty State */}
            {!error && filteredTransactions.length === 0 ? (

                <div className="empty-transactions">

                    <div className="empty-icon">
                        📋
                    </div>

                    <h3>
                        {transactions.length === 0
                            ? "No transactions yet"
                            : `No ${filter} transactions`}
                    </h3>

                    <p>
                        {transactions.length === 0
                            ? "Your buy and sell activity will appear here."
                            : "Try selecting a different filter."}
                    </p>

                </div>

            ) : (

                /* Transactions */
                <div className="transactions-container">

                    {filteredTransactions.map(
                        (transaction) => (

                            <div
                                className="transaction-card"
                                key={transaction._id}
                            >

                                <div className="transaction-left">

                                    <div
                                        className={`transaction-type ${
                                            transaction.type === "BUY"
                                                ? "buy"
                                                : "sell"
                                        }`}
                                    >
                                        {transaction.type}
                                    </div>

                                    <div className="transaction-info">

                                        <h3>
                                            {transaction.symbol}
                                        </h3>

                                        <p>
                                            {transaction.name}
                                        </p>

                                    </div>

                                </div>


                                <div className="transaction-details">

                                    <div>
                                        <span>Quantity</span>
                                        <strong>
                                            {transaction.quantity}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Price</span>
                                        <strong>
                                            ₹
                                            {Number(
                                                transaction.price
                                            ).toLocaleString(
                                                "en-IN",
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                }
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Total</span>
                                        <strong>
                                            ₹
                                            {Number(
                                                transaction.totalAmount
                                            ).toLocaleString(
                                                "en-IN",
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                }
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Date</span>
                                        <strong>
                                            {new Date(
                                                transaction.createdAt
                                            ).toLocaleString(
                                                "en-IN",
                                                {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                }
                                            )}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                        )
                    )}

                </div>

            )}

        </div>
    );
};

export default Transactions;