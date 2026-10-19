import axios from "axios";

const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

export const searchInstruments = async (query) => {
    const response = await axios.get(
        `${UPSTOX_BASE_URL}/instruments/search`,
        {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
            },
            params: {
                query,
                exchanges: "NSE,BSE",
                segments: "EQ",
                page_number: 1,
                records: 10
            }
        }
    );

    return response.data;
};

export const getLivePrice = async (instrumentKey) => {
    const response = await axios.get(
        "https://api.upstox.com/v3/market-quote/ltp",
        {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
            },
            params: {
                instrument_key: instrumentKey
            }
        }
    );

    return response.data;
};