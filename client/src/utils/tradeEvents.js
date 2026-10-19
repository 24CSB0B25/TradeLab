export const TRADE_COMPLETED_EVENT = "tradeCompleted";

export const notifyTradeCompleted = () => {
    window.dispatchEvent(
        new CustomEvent(TRADE_COMPLETED_EVENT)
    );
};