import { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";

const StockPriceChart = ({ data = [], symbol = "Stock" }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.solid, color: "#101127" },
        textColor: "#c8c9e8",
        fontFamily: "Inter, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(139, 92, 246, 0.12)" },
        horzLines: { color: "rgba(139, 92, 246, 0.12)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: "rgba(167, 139, 250, 0.25)",
        scaleMargins: { top: 0.12, bottom: 0.22 },
      },
      timeScale: {
        borderColor: "rgba(167, 139, 250, 0.25)",
        timeVisible: false,
        secondsVisible: false,
        rightOffset: 3,
      },
      localization: {
        priceFormatter: (price) =>
          `₹${Number(price).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#20d6a2",
      downColor: "#ff4d8d",
      borderUpColor: "#20d6a2",
      borderDownColor: "#ff4d8d",
      wickUpColor: "#20d6a2",
      wickDownColor: "#ff4d8d",
      priceLineVisible: true,
      lastValueVisible: true,
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    const chart = chartRef.current;

    if (!candleSeries || !chart || !Array.isArray(data) || data.length === 0) {
      return;
    }

    // Upstox timestamps are ISO strings. Lightweight Charts expects Unix seconds.
    const candles = data
      .map((item) => {
        const timestamp = item.timestamp
          ? Math.floor(new Date(item.timestamp).getTime() / 1000)
          : null;

        const open = Number(item.open);
        const high = Number(item.high);
        const low = Number(item.low);
        const close = Number(item.close);

        if (
          !timestamp ||
          !Number.isFinite(open) ||
          !Number.isFinite(high) ||
          !Number.isFinite(low) ||
          !Number.isFinite(close)
        ) {
          return null;
        }

        return {
          time: timestamp,
          open,
          high,
          low,
          close,
          volume: Number(item.volume) || 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    // Keep one candle per timestamp in case the provider returns duplicates.
    const uniqueCandles = candles.filter(
      (item, index, array) => index === 0 || item.time !== array[index - 1].time
    );

    if (!uniqueCandles.length) return;

    candleSeries.setData(
      uniqueCandles.map(({ time, open, high, low, close }) => ({
        time,
        open,
        high,
        low,
        close,
      }))
    );

    volumeSeries?.setData(
      uniqueCandles.map(({ time, volume, close, open }) => ({
        time,
        value: volume,
        color:
          close >= open
            ? "rgba(32, 214, 162, 0.38)"
            : "rgba(255, 77, 141, 0.38)",
      }))
    );

    chart.timeScale().fitContent();
  }, [data]);

  return (
    <section className="real-chart-card">
      <div className="real-chart-heading">
        <div>
          <span className="real-chart-eyebrow">MARKET DATA · OHLC</span>
          <h2>{symbol} Price History</h2>
          <p>Historical candles from the connected market-data provider</p>
        </div>
        <span className="real-chart-badge">
          <span className="real-chart-live-dot" />
          Historical data
        </span>
      </div>

      {data.length === 0 ? (
        <div className="real-chart-empty">
          No historical candles are available for this instrument yet.
        </div>
      ) : (
        <>
          <div className="real-chart-legend">
            <span><i className="legend-up" /> Bullish candle</span>
            <span><i className="legend-down" /> Bearish candle</span>
            <span>Scroll to zoom · Drag to pan</span>
          </div>
          <div className="real-chart-canvas" ref={containerRef} />
        </>
      )}
    </section>
  );
};

export default StockPriceChart;
