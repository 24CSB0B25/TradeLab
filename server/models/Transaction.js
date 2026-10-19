import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
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

        type: {
            type: String,
            enum: ["BUY", "SELL"],
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        costBasis: {
            type: Number,
            min: 0,
            default: null
        },

        realizedProfitLoss: {
            type: Number,
            default: null
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Transaction", transactionSchema);