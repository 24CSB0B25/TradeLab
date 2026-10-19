import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getWatchlist,
    removeFromWatchlist
} from "../services/api";

import useLivePrices from "../hooks/useLivePrices";
import "./Watchlist.css";


const Watchlist = () => {

    const navigate = useNavigate();

    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState(null);


    // Fetch watchlist
    useEffect(() => {

        const fetchWatchlist = async () => {

            try {

                const response = await getWatchlist();

                setWatchlist(
                    response.watchlist || []
                );

            } catch (error) {

                console.error(
                    "Watchlist error:",
                    error
                );

            } finally {

                setLoading(false);

            }
        };


        fetchWatchlist();

    }, []);


    // Get instrument keys
    const instrumentKeys =
        watchlist.map(
            (stock) => stock.instrumentKey
        );


    // Live prices
    const {
        prices,
        loading: pricesLoading
    } = useLivePrices(
        instrumentKeys,
        1000
    );


    // Remove stock
    const handleRemove = async (
        instrumentKey
    ) => {

        try {

            setRemoving(instrumentKey);

            await removeFromWatchlist(
                instrumentKey
            );

            setWatchlist(
                (current) =>
                    current.filter(
                        (stock) =>
                            stock.instrumentKey !==
                            instrumentKey
                    )
            );

        } catch (error) {

            console.error(
                "Remove watchlist error:",
                error
            );

        } finally {

            setRemoving(null);

        }
    };


    if (loading) {

        return (
            <div className="watchlist-page">
                <h2>Loading watchlist...</h2>
            </div>
        );

    }


    return (

        <div className="watchlist-page">

            {/* Header */}

            <div className="watchlist-header">

                <div>

                    <h1>Watchlist</h1>

                    <p>
                        Track stocks you're interested in
                    </p>

                </div>


                <div className="watchlist-count">

                    {watchlist.length}{" "}

                    {watchlist.length === 1
                        ? "Stock"
                        : "Stocks"}

                </div>

            </div>


            {/* Empty state */}

            {watchlist.length === 0 ? (

                <div className="empty-watchlist">

                    <div className="empty-icon">
                        ⭐
                    </div>

                    <h3>
                        Your watchlist is empty
                    </h3>

                    <p>
                        Add stocks you're interested
                        in tracking.
                    </p>

                </div>

            ) : (

                <div className="watchlist-container">

                    {watchlist.map(
                        (stock) => {

                            const priceKey = Object.keys(prices).find(
                                (key) =>
                                    key === stock.instrumentKey ||
                                    key === stock.instrumentKey.replace("|", ":") ||
                                    key === stock.instrumentKey.replace(":", "|") ||
                                    key.includes(stock.symbol)
                            );

                            const priceData = priceKey
                                ? prices[priceKey]
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
                                    className="watchlist-card"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            navigate(
                                                `/stock/${encodeURIComponent(stock.instrumentKey)}`,
                                                {
                                                    state: {
                                                        symbol: stock.symbol,
                                                        name: stock.name,
                                                        exchange: stock.exchange
                                                    }
                                                }
                                            );
                                        }
                                    }}
                                    onClick={() =>
                                        navigate(
                                            `/stock/${encodeURIComponent(
                                                stock.instrumentKey
                                            )}`,
                                            {
                                                state: {
                                                    symbol: stock.symbol,
                                                    name: stock.name,
                                                    exchange: stock.exchange
                                                }
                                            }
                                        )
                                    }
                                >

                                    {/* Stock information */}

                                    <div className="watchlist-stock">

                                        <div className="watchlist-symbol">

                                            {stock.symbol}

                                        </div>

                                        <div>

                                            <h3>
                                                {stock.symbol}
                                            </h3>

                                            <p>
                                                {stock.name}
                                            </p>

                                        </div>

                                    </div>


                                    {/* Price */}

                                    <div className="watchlist-price">

                                        <span>
                                            Current Price
                                        </span>

                                        <strong>
                                            {currentPrice
                                                ? `₹${Number(
                                                    currentPrice
                                                ).toLocaleString(
                                                    "en-IN",
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    }
                                                )}`
                                                : pricesLoading
                                                    ? "Loading..."
                                                    : "—"}
                                        </strong>

                                    </div>


                                    {/* Change */}

                                    <div className="watchlist-change">

                                        <span>
                                            Change
                                        </span>

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


                                    {/* Remove */}

                                    <button
                                        className="remove-watchlist-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove(stock.instrumentKey);
                                        }}
                                    >
                                        Remove
                                    </button>

                                </div>

                            );

                        }
                    )}

                </div>

            )}

        </div>
    );
};


export default Watchlist;