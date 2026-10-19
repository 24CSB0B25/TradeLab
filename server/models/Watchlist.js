import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        instrumentKey: {
            type: String,
            required: true
        },

        symbol: {
            type: String,
            required: true
        },

        name: {
            type: String,
            required: true
        },

        exchange: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

watchlistSchema.index(
    {
        user: 1,
        instrumentKey: 1
    },
    {
        unique: true
    }
);

export default mongoose.model(
    "Watchlist",
    watchlistSchema
);