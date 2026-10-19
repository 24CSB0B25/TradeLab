import mongoose from "mongoose";

const portfolioSnapshotSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        totalPortfolioValue: {
            type: Number,
            required: true,
            min: 0,
        },
        virtualCash: {
            type: Number,
            required: true,
            min: 0,
        },
        totalValue: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { timestamps: true }
);

portfolioSnapshotSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model(
    "PortfolioSnapshot",
    portfolioSnapshotSchema
);