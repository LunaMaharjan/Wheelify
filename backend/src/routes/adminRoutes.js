import express from "express";
import adminAuth from "../middlewares/adminAuth.js";
import {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    toggleUserVerification,
    getAllVendors,
    approveVendor,
    rejectVendor,
    toggleVendorVerification,
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuth);

// Dashboard stats
router.get("/stats", getDashboardStats);

// User management routes
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/verification", toggleUserVerification);

// Vendor management routes
router.get("/vendors", getAllVendors);
router.patch("/vendors/:id/approve", approveVendor);
router.patch("/vendors/:id/reject", rejectVendor);
router.patch("/vendors/:id/verification", toggleVendorVerification);

export default router;
