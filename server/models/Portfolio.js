import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema(
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

        quantity: {
            type: Number,
            required: true,
            min: 0
        },

        averageBuyPrice: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Portfolio", portfolioSchema);