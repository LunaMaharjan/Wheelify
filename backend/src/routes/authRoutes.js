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
import { searchVehicles, getVehicleById } from "../controllers/searchController.js";

const router = express.Router();

// Signup route (with optional file upload)
router.post("/register", upload.single("licenseImage"), signup);

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

// Public search (no auth required)
router.get("/vehicles/search", searchVehicles);
router.get("/vehicles/:id", getVehicleById);

export default router;

