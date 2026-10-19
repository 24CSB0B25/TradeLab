import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const formatINR = (value) =>
  `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const DashboardMarketChart = ({
  data = [],
  title = "Market Trend",
  subtitle = "Historical market movement",
  symbol = "Market",
  loading = false,
  error = "",
}) => {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .map((item) => {
          const rawTime = item.timestamp ?? item.time ?? item.date;
          const rawValue = item.close ?? item.price ?? item.value;
          const date = new Date(rawTime);
          const value = Number(rawValue);

          if (!rawTime || !Number.isFinite(date.getTime()) || !Number.isFinite(value)) {
            return null;
          }

          return {
            timestamp: date.getTime(),
            label: date.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            }),
            price: value,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.timestamp - b.timestamp),
    [data]
  );

  const latest = chartData.at(-1);
  const first = chartData[0];
  const change = latest && first ? latest.price - first.price : 0;
  const changePercent =
    first?.price ? (change / first.price) * 100 : 0;
  const rising = change >= 0;

  return (
    <section className="dashboard-market-chart">
      <div className="dashboard-market-chart__header">
        <div>
          <span className="dashboard-market-chart__eyebrow">
            MARKET INSIGHTS
          </span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {latest && (
          <div className="dashboard-market-chart__summary">
            <span>Latest {symbol} value</span>
            <strong>{formatINR(latest.price)}</strong>
            <span className={rising ? "chart-change is-up" : "chart-change is-down"}>
              {rising ? "+" : ""}
              {change.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              {" "}({rising ? "+" : ""}
              {changePercent.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="dashboard-market-chart__state">Loading historical market data…</div>
      ) : error ? (
        <div className="dashboard-market-chart__state is-error">{error}</div>
      ) : chartData.length < 2 ? (
        <div className="dashboard-market-chart__state">
          Historical data will appear here when at least two real data points are available.
        </div>
      ) : (
        <div className="dashboard-market-chart__plot">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 12, left: 4, bottom: 2 }}
            >
              <defs>
                <linearGradient id="dashboardMarketFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.34} />
                  <stop offset="90%" stopColor="#a855f7" stopOpacity={0.015} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="rgba(167, 139, 250, 0.13)"
                strokeDasharray="4 5"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fill: "#aeb0d0", fontSize: 12 }}
                axisLine={{ stroke: "rgba(167, 139, 250, 0.25)" }}
                tickLine={false}
                minTickGap={28}
              />

              <YAxis
                orientation="right"
                domain={["auto", "auto"]}
                tickFormatter={(value) => Number(value).toLocaleString("en-IN")}
                tick={{ fill: "#aeb0d0", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={76}
              />

              <Tooltip
                labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
                formatter={(value) => [formatINR(value), symbol]}
                contentStyle={{
                  background: "#17172f",
                  border: "1px solid rgba(167, 139, 250, 0.35)",
                  borderRadius: 12,
                  color: "#f5f3ff",
                  boxShadow: "0 12px 32px rgba(0,0,0,.28)",
                }}
                labelStyle={{ color: "#c4b5fd", marginBottom: 5 }}
              />

              <Area
                type="monotone"
                dataKey="price"
                name={symbol}
                stroke="#c084fc"
                strokeWidth={2.5}
                fill="url(#dashboardMarketFill)"
                activeDot={{
                  r: 5,
                  fill: "#f5d0fe",
                  stroke: "#a855f7",
                  strokeWidth: 2,
                }}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="dashboard-market-chart__footer">
        <span><i className="chart-footer-dot" /> Based on available historical data</span>
        <span>Hover over the chart for values</span>
      </div>
    </section>
  );
};

export default DashboardMarketChart;
