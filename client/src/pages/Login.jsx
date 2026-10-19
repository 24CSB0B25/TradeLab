import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {

    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            await login(email, password);

            navigate("/dashboard");

        } catch (error) {

            setError(
                error.response?.data?.message ||
                "Login failed"
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-card">

                {/* Logo / Brand */}

                <div className="auth-brand">
                    <h1>TradeLab</h1>

                    <p>
                        Paper trading made simple
                    </p>
                </div>


                {/* Heading */}

                <div className="auth-heading">

                    <h2>
                        Welcome back
                    </h2>

                    <p>
                        Login to continue to your portfolio
                    </p>

                </div>


                {/* Error */}

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}


                {/* Login Form */}

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                    </div>


                    <button
                        className="auth-submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                </form>


                {/* Register */}

                <div className="auth-footer">

                    <span>
                        Don't have an account?
                    </span>

                    <button
                        className="auth-link"
                        onClick={() =>
                            navigate("/register")
                        }
                    >
                        Create Account
                    </button>

                </div>

            </div>

        </div>
    );
};

export default Login;