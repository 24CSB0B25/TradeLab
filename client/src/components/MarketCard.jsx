const MarketCard = ({ market, data }) => {
    if (!data) {
        return (
            <div className="market-card">
                <p className="exchange">{market.exchange}</p>
                <h3>{market.name}</h3>
                <p>No data available</p>
            </div>
        );
    }

    const price = data.last_price;
    const previousClose = data.cp;

    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    return (
        <div className="market-card">

            <p className="exchange">
                {market.exchange}
            </p>

            <h3>
                {market.name}
            </h3>

            <h2>
                ₹{price?.toLocaleString("en-IN")}
            </h2>

            <p
                className={
                    change >= 0
                        ? "positive"
                        : "negative"
                }
            >
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)}
                {" "}
                ({changePercent.toFixed(2)}%)
            </p>

            <p className="previous-close">
                Previous Close: ₹
                {previousClose?.toLocaleString("en-IN")}
            </p>

        </div>
    );
};

export default MarketCard;