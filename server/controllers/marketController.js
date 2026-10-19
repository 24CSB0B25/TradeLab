import axios from "axios";


// =====================================
// GET LIVE MARKET PRICE
// =====================================

export const getMarketPrices = async (req, res) => {

    try {

        const { instrument_key } = req.query;

        if (!instrument_key) {

            return res.status(400).json({
                success: false,
                message: "instrument_key is required"
            });

        }

        const response = await axios.get(
            "https://api.upstox.com/v3/market-quote/ltp",
            {
                params: {
                    instrument_key
                },

                headers: {
                    Accept: "application/json",
                    Authorization:
                        `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
                }
            }
        );

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {

        console.error(
            "Upstox LTP Error:",
            error.response?.data ||
            error.message
        );

        res.status(
            error.response?.status || 500
        ).json({
            success: false,
            message: "Failed to fetch market data",
            error:
                error.response?.data ||
                error.message
        });

    }
};


// =====================================
// SEARCH STOCKS
// =====================================

export const searchMarketInstruments = async (req, res) => {

    try {

        const { q } = req.query;

        if (!q || q.trim().length < 2) {

            return res.json({
                success: true,
                data: []
            });

        }

        const response = await axios.get(
            "https://api.upstox.com/v2/instruments/search",
            {
                params: {
                    query: q.trim(),
                    exchanges: "NSE,BSE",
                    segments: "EQ",
                    page_number: 1,
                    records: 10
                },

                headers: {
                    Accept: "application/json",
                    Authorization:
                        `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
                }
            }
        );

        res.json({
            success: true,
            data: response.data.data || []
        });

    } catch (error) {

        console.error(
            "Instrument Search Error:",
            error.response?.data ||
            error.message
        );

        res.status(
            error.response?.status || 500
        ).json({
            success: false,
            message: "Unable to search stocks",
            error:
                error.response?.data ||
                error.message
        });

    }
};


// =====================================
// GET HISTORICAL DATA
// =====================================

export const getHistoricalData = async (req, res) => {

    try {

        const {
            instrument_key,
            interval = "1",
            unit = "days"
        } = req.query;

        if (!instrument_key) {

            return res.status(400).json({
                success: false,
                message: "instrument_key is required"
            });

        }

        // Today's date
        const toDate = new Date()
            .toISOString()
            .split("T")[0];

        // One year ago
        const fromDate = new Date();

        fromDate.setFullYear(
            fromDate.getFullYear() - 1
        );

        const fromDateString =
            fromDate.toISOString().split("T")[0];


        const url =
            `https://api.upstox.com/v3/historical-candle/` +
            `${encodeURIComponent(instrument_key)}/` +
            `${unit}/` +
            `${interval}/` +
            `${toDate}/` +
            `${fromDateString}`;


        console.log(
            "Historical API URL:",
            url
        );


        const response = await axios.get(
            url,
            {
                headers: {
                    Accept: "application/json",
                    Authorization:
                        `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
                }
            }
        );


        res.json({
            success: true,
            data: response.data
        });


    } catch (error) {

        console.error(
            "Historical Data Error:",
            error.response?.data ||
            error.message
        );

        res.status(
            error.response?.status || 500
        ).json({
            success: false,
            message:
                "Failed to fetch historical data",
            error:
                error.response?.data ||
                error.message
        });

    }
};