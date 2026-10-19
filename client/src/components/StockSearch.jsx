import { useEffect, useState } from "react";
import { searchStocks } from "../services/api";
import {useNavigate} from  "react-router-dom";

const StockSearch = ({ onStockSelect }) => {

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {

        // Don't search for less than 2 characters
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        // Debounce API request
        const timer = setTimeout(async () => {

            try {

                setLoading(true);

                const response = await searchStocks(
                    query.trim()
                );

                setResults(response.data || []);

            } catch (error) {

                console.error(
                    "Stock search error:",
                    error
                );

                setResults([]);

            } finally {

                setLoading(false);

            }

        }, 400);

        return () => clearTimeout(timer);

    }, [query]);


    const handleSelectStock = (stock) => {

        setQuery(stock.trading_symbol);
        setResults([]);

        navigate(
            `/stock/${encodeURIComponent(stock.instrument_key)}`,
            {
                state: {
                    symbol: stock.trading_symbol,
                    name: stock.name,
                    exchange: stock.exchange
                }
            }
        );
    };


    return (

        <div className="stock-search">

            <div className="search-box">

                <span className="search-icon">
                    🔍
                </span>

                <input
                    type="text"
                    placeholder="Search stocks..."
                    value={query}
                    onChange={(e) =>
                        setQuery(e.target.value)
                    }
                />

                {loading && (
                    <span className="search-loading">
                        Searching...
                    </span>
                )}

            </div>


            {results.length > 0 && (

                <div className="search-results">

                    {results.map((stock) => (

                        <div
                            key={stock.instrument_key}
                            className="search-result"
                            onClick={() =>
                                handleSelectStock(stock)
                            }
                        >

                            <div>

                                <strong>
                                    {stock.trading_symbol}
                                </strong>

                                <p>
                                    {stock.name ||
                                        stock.short_name}
                                </p>

                            </div>

                            <span>
                                {stock.exchange}
                            </span>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
};

export default StockSearch;