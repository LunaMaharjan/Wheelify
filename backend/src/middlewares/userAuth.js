import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const userAuth = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.json({ success: false, message: "Not Authorized. Login Again" });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(tokenDecode.id).select(
            "-password -__v -createdAt -updatedAt"
        );

        if (!user) {
            return res.json({ success: false, message: "User not found. Login Again" });
        }

        req.user = user; // ✅ Attach full user object for use in routes
        req.userId = tokenDecode.id; // ✅ Set userId for easy access

        // ✅ Only set userId safely (avoid crash on GET)
        if (!req.body) req.body = {}; // Ensure req.body exists
        req.body.userId = tokenDecode.id;

        next();
    } catch (error) {
        console.error("❌ Auth Middleware Error:", error.message);
        return res.json({ success: false, message: error.message });
    }
};

export default userAuth;
