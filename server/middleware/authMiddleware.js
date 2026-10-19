import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
    try {
        // Get authorization header
        const authHeader = req.headers.authorization;

        // Check if token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized. No token provided."
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("Decoded JWT:", decoded);

        req.user = decoded;

        // Continue to controller
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Not authorized. Invalid or expired token."
        });
    }
};

export default protect;