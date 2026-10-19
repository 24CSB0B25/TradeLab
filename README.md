# TradeLab --- Virtual Stock Market Simulator

TradeLab is a full-stack web application for exploring the stock market
and practising trading with virtual money. It combines market data from
Upstox with a simulated trading workflow, so users can search for
stocks, inspect price charts, place virtual buy/sell orders, and track
their portfolio without placing real trades.

> **Disclaimer:** TradeLab is an educational/paper-trading application.
> It does not execute real stock-market orders and is not financial
> advice.

## Features

-   **Authentication** --- Register and log in using JWT-based
    authentication.
-   **Market dashboard** --- View market indices and market information.
-   **Stock search** --- Search for instruments and navigate to
    individual stock pages.
-   **Stock details and charts** --- View available price information
    and historical OHLC/candlestick and volume charts.
-   **Live market prices** --- Retrieve supported market quotes through
    the backend's Upstox integration.
-   **Virtual wallet** --- Trade using virtual cash rather than real
    funds.
-   **Simulated buy and sell orders** --- Execute paper trades and
    update holdings and cash balances.
-   **Portfolio** --- Review holdings, average buy prices, current
    values, and profit/loss where price data is available.
-   **Watchlist** --- Save stocks to monitor and remove them when no
    longer needed.
-   **Transaction history** --- Review BUY and SELL transactions, filter
    by type, and sort by date.
-   **Trading analytics and portfolio history** --- Supporting
    analytics/snapshot functionality is available in the project where
    configured.

The application uses live or historical market data where available.
Quote availability depends on the instrument, API access, and Upstox
service response.

## Technology Stack

### Frontend

-   React
-   Vite
-   React Router
-   Axios
-   JavaScript, HTML, and CSS
-   `lightweight-charts` for financial charts

### Backend

-   Node.js
-   Express
-   MongoDB with Mongoose
-   JSON Web Tokens (JWT) for authentication
-   Password hashing
-   Axios for external API requests

### External Services

-   **Upstox API** --- Market quotes and historical market data
-   **MongoDB Atlas** --- Cloud database (a local MongoDB instance can
    also be configured)

## Application Architecture

The project follows a client-server architecture:

``` text
TradeLab/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── hooks/           # Custom React hooks
│       ├── pages/           # Dashboard, stock, portfolio, etc.
│       ├── services/        # API client and frontend service calls
│       ├── utils/           # Shared utilities and trade events
│       └── ...              # App entry points and configuration
│
└── server/                  # Express backend
    ├── controllers/         # Request handlers and business logic
    ├── middleware/          # Authentication and request middleware
    ├── models/              # Mongoose schemas
    ├── routes/              # API routes
    ├── services/            # Upstox integration and related services
    └── ...                  # Server entry point and configuration
```

This is a representative structure; filenames may vary slightly as the
project evolves.

## Prerequisites

Install the following before running the application:

-   Node.js (a current LTS release is recommended)
-   npm
-   A MongoDB Atlas database or another accessible MongoDB instance
-   Upstox API credentials for market-data features

## Getting Started

### 1. Clone the repository

``` bash
git clone <YOUR_REPOSITORY_URL>
cd TradeLab
```

Replace `<YOUR_REPOSITORY_URL>` with your repository URL.

### 2. Install backend dependencies

``` bash
cd server
npm install
```

Create a `server/.env` file. Use the variable names expected by your
server configuration; a typical configuration looks like:

``` env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
UPSTOX_ACCESS_TOKEN=your_upstox_access_token
```

**Important:** - Keep `.env` files private. Never commit database
credentials, JWT secrets, or Upstox access tokens. - The variable names
above are examples of the common configuration used by this project. If
your code reads a different name (for example, for the MongoDB URI or
Upstox token), use the exact name referenced in your server code. - In
MongoDB Atlas, configure database access and network access for the
environment running your backend. - Upstox access tokens may expire and
need to be renewed according to Upstox's authentication flow.

Start the backend using the script defined in `server/package.json`. For
example, if a `dev` script is configured:

``` bash
npm run dev
```

Otherwise, use the start script available in that package.

### 3. Install frontend dependencies

Open a **second terminal** from the project root:

``` bash
cd client
npm install
```

If your frontend uses a Vite development script, start it with:

``` bash
npm run dev
```

Vite will print the local development URL in the terminal. Open that URL
in your browser.

### 4. Configure the frontend API URL

Ensure the frontend API client points to the backend address and port
where Express is running. Check `client/src/services/api.js` for the
configured Axios base URL.

If the API URL is controlled by a Vite environment variable, create
`client/.env` using the exact variable name referenced in that file. Do
not assume a variable name without checking the implementation.

## API Areas

The backend exposes API routes for authentication, market data, and
trading. The following route families are used by the application:

  -----------------------------------------------------------------------
  Route family                        Purpose
  ----------------------------------- -----------------------------------
  `/api/auth`                         Registration and login

  `/api/market`                       Market quotes, stock search, and
                                      historical data

  `/api/trade`                        Simulated trades, portfolio, and
                                      transaction-related operations
  -----------------------------------------------------------------------

Examples of market endpoints used during development include
`/api/market/ltp`, `/api/market/search`, and `/api/market/history`;
trading endpoints include `/api/trade/buy`, `/api/trade/sell`,
`/api/trade/portfolio`, and `/api/trade/transactions`.

The exact available endpoints and request formats are defined by the
route files in `server/routes/`. Protected endpoints require the
authentication token expected by the backend middleware.

## How It Works

1.  A user registers or logs in.
2.  The frontend communicates with the Express API.
3.  The backend validates requests and accesses MongoDB for user,
    portfolio, and transaction data.
4.  Market-data requests are handled by the backend's Upstox service.
5.  A simulated BUY or SELL order updates the user's virtual trading
    state and records a transaction.
6.  The frontend refreshes the portfolio, transaction history, and
    related views.

## Security Notes

-   Do not expose the Upstox access token in frontend code.
-   Do not commit `.env` files or secrets to version control.
-   Use a strong, unique JWT secret outside local development.
-   Restrict MongoDB Atlas network access to trusted environments rather
    than leaving the database unnecessarily exposed.
-   Treat market data as informational; API availability, latency, and
    instrument coverage can vary.

## Troubleshooting

### MongoDB connection fails

-   Verify the MongoDB connection string and cluster hostname.
-   Check that the backend's environment variable name matches the code.
-   Confirm that the current IP/network is allowed in MongoDB Atlas.
-   If the error is DNS-related, check the cluster hostname and DNS
    resolution.

### Market prices or charts do not load

-   Verify that the backend has a valid Upstox access token.
-   Check the backend terminal for Upstox API errors.
-   Confirm that the instrument is supported and that the requested
    historical interval is available.
-   Do not interpret missing chart data as zero-price data.

### Frontend cannot reach the backend

-   Confirm that the backend is running.
-   Check the Axios base URL in `client/src/services/api.js`.
-   Check for CORS errors and ensure the frontend origin is permitted by
    the server configuration.

### An npm script is missing

Run the following in the relevant `client` or `server` directory to
inspect available scripts:

``` bash
npm run
```

Use a script that exists in that package's `package.json`.

## Project Status

TradeLab's core paper-trading workflow includes authentication,
market-data lookup, stock details/charts, virtual buy/sell transactions,
portfolio tracking, a watchlist, and transaction history. Additional
analytics or portfolio-history features depend on the corresponding
backend routes, models, and frontend components being configured.

## Future Improvements

Potential extensions include: - More advanced order types and risk
controls - Price alerts and notifications - A trading journal and richer
performance analytics - Backtesting and historical replay - Challenges,
leaderboards, and learning-oriented trading exercises

These are possible extensions, not a claim that every item is currently
implemented.

## Contributing

1.  Create a branch for your change.
2.  Keep secrets and personal credentials out of commits.
3.  Test the relevant frontend and backend flows.
4.  Open a pull request with a summary of the change and any setup
    requirements.

## License

Add the license you intend to use for this project. Until a license is
added, all rights remain with the copyright holder.
