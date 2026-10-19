import { useEffect, useState } from "react";
import { getMarketPrices } from "../services/api";

const useLivePrices = (instrumentKeys, intervalMs = 1000) => {

    const [prices, setPrices] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        if (!instrumentKeys || instrumentKeys.length === 0) {
            setPrices({});
            setLoading(false);
            return;
        }

        let isMounted = true;

        const fetchPrices = async () => {

            try {

                const response =
                    await getMarketPrices(instrumentKeys);

                const data =
                    response.data?.data || {};

                if (isMounted) {

                    // Replace prices only when
                    // new data has arrived.
                    setPrices(data);

                    // Loading is only for
                    // the FIRST request.
                    setLoading(false);
                }

            } catch (error) {

                console.error(
                    "Live price update error:",
                    error
                );

                if (isMounted) {
                    setLoading(false);
                }

            }
        };


        // First request
        fetchPrices();


        // Background updates
        const interval = setInterval(
            fetchPrices,
            intervalMs
        );


        return () => {

            isMounted = false;

            clearInterval(interval);

        };

    }, [JSON.stringify(instrumentKeys), intervalMs]);


    return {
        prices,
        loading
    };
};

export default useLivePrices;