import express from "express";
import userAuth from "../middlewares/userAuth.js";
import {
    submitApplication,
    getMyApplication,
    getMyVehicles,
    getMyRentals,
    getMyRevenue
} from "../controllers/vendorController.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

// All vendor routes require user authentication
router.use(userAuth);

// Submit vendor application (with file uploads)
router.post("/apply", 
    upload.fields([
        { name: 'citizenshipFront', maxCount: 1 },
        { name: 'citizenshipBack', maxCount: 1 },
    ]),
    async (req, res, next) => {
        try {
            // Extract file URLs from Cloudinary
            // multer-storage-cloudinary stores files in req.files
            const files = req.files;
            
            const citizenshipFront = files?.citizenshipFront?.[0]?.path;
            const citizenshipBack = files?.citizenshipBack?.[0]?.path;
            const otherDocuments = files?.otherDocuments?.map(file => file.path) || [];

            if (!citizenshipFront || !citizenshipBack) {
                return res.status(400).json({
                    success: false,
                    message: "Citizenship front and back images are required"
                });
            }

            // Add file URLs to request body
            req.body.citizenshipFront = citizenshipFront;
            req.body.citizenshipBack = citizenshipBack;

            // Call the controller
            next();
        } catch (error) {
            console.error("File upload error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to upload files"
            });
        }
    },
    submitApplication
);

// Get current user's application
router.get("/application", getMyApplication);

// Get vendor's vehicles
router.get("/vehicles", getMyVehicles);

// Get vendor's rentals
router.get("/rentals", getMyRentals);

// Get vendor's revenue stats
router.get("/revenue", getMyRevenue);

export default router;

