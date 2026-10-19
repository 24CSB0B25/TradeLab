import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api"
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const getMarketPrices = async (instrumentKeys) => {
    const response = await API.get("/market/ltp", {
        params: {
            instrument_key: instrumentKeys.join(",")
        }
    });

    return response.data;
};

export const searchStocks = async (query) => {
    const response = await API.get("/market/search", {
        params: {
            q: query
        }
    });

    return response.data;
};

export const getHistoricalData = async (
    instrumentKey,
    unit = "days",
    interval = "1"
) => {

    const response = await API.get(
        "/market/history",
        {
            params: {
                instrument_key: instrumentKey,
                unit,
                interval
            }
        }
    );

    return response.data;
};

export const getPortfolio = async () => {
    const response = await API.get("/trade/portfolio");
    return response.data;
};

export const buyStock = async (stockData) => {
    const response = await API.post("/trade/buy", stockData);
    return response.data;
};

export const sellStock = async (stockData) => {
    const response = await API.post("/trade/sell", stockData);
    return response.data;
};

export const getTransactions = async () => {
    const response = await API.get("/trade/transactions");
    return response.data;
};

// =============================
// WATCHLIST
// =============================

export const getWatchlist = async () => {
    const response = await API.get("/watchlist");

    return response.data;
};


export const addToWatchlist = async (stockData) => {
    const response = await API.post(
        "/watchlist",
        stockData
    );

    return response.data;
};


export const removeFromWatchlist = async (
    instrumentKey
) => {
    const response = await API.delete(
        `/watchlist/${encodeURIComponent(instrumentKey)}`
    );

    return response.data;
};

export const getTradingAnalytics = async () => {
    const response = await API.get("/trade/analytics");
    return response.data;
};

// Record a portfolio snapshot
export const recordPortfolioSnapshot = async () => {
    const response = await API.post("/trade/snapshots");
    return response.data;
};

// Retrieve portfolio history
export const getPortfolioHistory = async () => {
    const response = await API.get("/trade/history");
    return response.data;
};

export default API;