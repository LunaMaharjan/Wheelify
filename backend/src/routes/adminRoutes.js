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
    getVendorApplications,
    getVendorApplicationDetails,
} from "../controllers/adminController.js";
import { getLicenseSubmissions, reviewLicenseSubmission } from "../controllers/licenseController.js";

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
router.get("/vendors/applications", getVendorApplications);
router.get("/vendors/applications/:id", getVendorApplicationDetails);
router.patch("/vendors/:id/approve", approveVendor);
router.patch("/vendors/:id/reject", rejectVendor);
router.patch("/vendors/:id/verification", toggleVendorVerification);

// License verification routes
router.get("/licenses", getLicenseSubmissions);
router.patch("/licenses/:id/review", reviewLicenseSubmission);

export default router;
