import Watchlist from "../models/Watchlist.js";


// =========================================
// ADD TO WATCHLIST
// =========================================

export const addToWatchlist = async (req, res) => {

    try {

        const {
            instrumentKey,
            symbol,
            name,
            exchange
        } = req.body;


        if (
            !instrumentKey ||
            !symbol ||
            !name ||
            !exchange
        ) {

            return res.status(400).json({
                message: "All stock details are required"
            });

        }


        const existingStock =
            await Watchlist.findOne({
                user: req.user.userId,
                instrumentKey
            });


        if (existingStock) {

            return res.status(400).json({
                message: "Stock is already in your watchlist"
            });

        }


        const watchlistItem =
            await Watchlist.create({

                user: req.user.userId,

                instrumentKey,

                symbol,

                name,

                exchange

            });


        res.status(201).json({

            message: "Stock added to watchlist",

            watchlistItem

        });


    } catch (error) {

        console.error(
            "Add watchlist error:",
            error
        );

        res.status(500).json({

            message:
                error.message ||
                "Failed to add stock to watchlist"

        });

    }

};


// =========================================
// GET WATCHLIST
// =========================================

export const getWatchlist = async (req, res) => {

    try {

        const watchlist =
            await Watchlist.find({
                user: req.user.userId
            })
            .sort({
                createdAt: -1
            });


        res.json({

            watchlist

        });


    } catch (error) {

        console.error(
            "Get watchlist error:",
            error
        );

        res.status(500).json({

            message:
                error.message ||
                "Failed to fetch watchlist"

        });

    }

};


// =========================================
// REMOVE FROM WATCHLIST
// =========================================

export const removeFromWatchlist = async (req, res) => {

    try {

        const {
            instrumentKey
        } = req.params;


        const deletedStock =
            await Watchlist.findOneAndDelete({

                user: req.user.userId,

                instrumentKey

            });


        if (!deletedStock) {

            return res.status(404).json({

                message:
                    "Stock not found in watchlist"

            });

        }


        res.json({

            message:
                "Stock removed from watchlist"

        });


    } catch (error) {

        console.error(
            "Remove watchlist error:",
            error
        );

        res.status(500).json({

            message:
                error.message ||
                "Failed to remove stock from watchlist"

        });

    }

};