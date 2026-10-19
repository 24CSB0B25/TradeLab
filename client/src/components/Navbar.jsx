import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {

    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <nav className="navbar">

            <div className="navbar-logo">
                <Link to="/dashboard">
                    TradeLab
                </Link>
            </div>

            <div className="navbar-links">

                <Link
                    to="/dashboard"
                    className={
                        location.pathname === "/dashboard"
                            ? "active"
                            : ""
                    }
                >
                    Dashboard
                </Link>

                <Link
                    to="/watchlist"
                    className={
                        location.pathname === "/watchlist"
                            ? "active"
                            : ""
                    }
                >
                    Watchlist
                </Link>

                <Link
                    to="/portfolio"
                    className={
                        location.pathname === "/portfolio"
                            ? "active"
                            : ""
                    }
                >
                    Portfolio
                </Link>

                <Link
                    to="/transactions"
                    className={
                        location.pathname === "/transactions"
                            ? "active"
                            : ""
                    }
                >
                    Transactions
                </Link>

                <button onClick={handleLogout}>
                    Logout
                </button>

            </div>

        </nav>
    );
};

export default Navbar;