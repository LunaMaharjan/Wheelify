import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const buildCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
    };
};

const adminAuth = async (req, res, next) => {
    const { token } = req.cookies || {};

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized. Login again." });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(tokenDecode.id).select(
            "-password -__v -createdAt -updatedAt"
        );

        if (!user) {
            return res.status(401).json({ success: false, message: "User not found. Login Again" });
        }

        // Check if user is admin
        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required.",
            });
        }

        req.user = user;
        req.userId = tokenDecode.id;

        if (!req.body) req.body = {};
        req.body.userId = tokenDecode.id;

        next();
    } catch (error) {
        console.error("❌ Admin Auth Middleware Error:", error.message);

        res.clearCookie("token", { ...buildCookieOptions(), maxAge: 0 });

        const statusCode = error.name === "JsonWebTokenError" || error.name === "TokenExpiredError" ? 401 : 500;
        const message =
            error.name === "TokenExpiredError"
                ? "Session expired. Please login again."
                : error.name === "JsonWebTokenError"
                ? "Invalid token. Please login again."
                : "Authentication failed.";

        return res.status(statusCode).json({ success: false, message });
    }
};

export default adminAuth;
