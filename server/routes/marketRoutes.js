import express from "express";

import {
    getMarketPrices,
    searchMarketInstruments,
    getHistoricalData
} from "../controllers/marketController.js";

const router = express.Router();


// Live price
router.get(
    "/ltp",
    getMarketPrices
);


// Stock search
router.get(
    "/search",
    searchMarketInstruments
);


// Historical data
router.get(
    "/history",
    getHistoricalData
);


export default router;