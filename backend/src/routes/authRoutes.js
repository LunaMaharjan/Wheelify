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
import { upload } from "../utils/cloudinary.js";
import { uploadLicense } from "../controllers/licenseController.js";

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
router.post("/license/upload", userAuth, upload.single("licenseImage"), uploadLicense);

export default router;

