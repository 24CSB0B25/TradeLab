import Navbar from "./Navbar";
import ProtectedRoute from "./ProtectedRoute";

const ProtectedLayout = ({ children }) => {
    return (
        <ProtectedRoute>
            <Navbar />
            {children}
        </ProtectedRoute>
    );
};

export default ProtectedLayout;