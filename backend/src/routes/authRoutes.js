import express from "express";
import {
    signup,
    verifyEmail,
    resendVerification,
    login,
    logout,
    getProfile,
} from "../controllers/authController.js";
import userAuth from "../middlewares/userAuth.js";

const router = express.Router();

// Signup route
router.post("/register", signup);

// Verify email route
router.get("/verify-email", verifyEmail);

// Resend verification email route
router.post("/resend-verification", resendVerification);

// Login & logout
router.post("/login", login);
router.post("/logout", logout);

// Profile
router.get("/profile", userAuth, getProfile);

export default router;

