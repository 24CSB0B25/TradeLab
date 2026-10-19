import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import StockDetails from "./pages/StockDetails";
import Transactions from "./pages/Transactions";
import Watchlist from "./pages/Watchlist";

import ProtectedLayout from "./components/ProtectedLayout";

const App = () => {
    return (
        <Routes>

            <Route
                path="/"
                element={<Navigate to="/dashboard" />}
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                path="/dashboard"
                element={
                    <ProtectedLayout>
                        <Dashboard />
                    </ProtectedLayout>
                }
            />

            <Route
                path="/stock/:instrumentKey"
                element={
                    <ProtectedLayout>
                        <StockDetails />
                    </ProtectedLayout>
                }
            />

            <Route
                path="/portfolio"
                element={
                    <ProtectedLayout>
                        <Portfolio />
                    </ProtectedLayout>
                }
            />

            <Route
                path="/transactions"
                element={
                    <ProtectedLayout>
                        <Transactions />
                    </ProtectedLayout>
                }
            />

            <Route
                path="/watchlist"
                element={
                    <ProtectedLayout>
                        <Watchlist />
                    </ProtectedLayout>
                }
            />

        </Routes>
    );
};

export default App;