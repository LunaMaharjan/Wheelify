import express from "express";
import userAuth from "../middlewares/userAuth.js";
import {
    submitApplication,
    getMyApplication,
    uploadVehicle,
    updateVehicle,
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

// Upload vehicle (with file uploads)
router.post("/vehicles",
    upload.fields([
        { name: 'bluebook', maxCount: 1 },
        { name: 'vehicleImages', maxCount: 10 }
    ]),
    async (req, res, next) => {
        try {
            // Extract file URLs from Cloudinary
            const files = req.files;
            
            const bluebook = files?.bluebook?.[0]?.path;
            const vehicleImages = files?.vehicleImages?.map(file => file.path) || [];

            if (!bluebook) {
                return res.status(400).json({
                    success: false,
                    message: "Bluebook document is required"
                });
            }

            if (vehicleImages.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "At least one vehicle image is required"
                });
            }

            // Add file URLs to request body
            req.body.bluebook = bluebook;
            req.body.vehicleImages = vehicleImages;

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
    uploadVehicle
);

// Update vehicle (for rejected vehicles to resubmit)
router.put("/vehicles/:vehicleId",
    upload.fields([
        { name: 'bluebook', maxCount: 1 },
        { name: 'vehicleImages', maxCount: 10 }
    ]),
    async (req, res, next) => {
        try {
            // Extract file URLs from Cloudinary
            const files = req.files;
            
            // Bluebook and images are optional for updates (only update if provided)
            if (files?.bluebook?.[0]?.path) {
                req.body.bluebook = files.bluebook[0].path;
            }
            
            if (files?.vehicleImages && files.vehicleImages.length > 0) {
                req.body.vehicleImages = files.vehicleImages.map(file => file.path);
            }

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
    updateVehicle
);

// Get vendor's vehicles
router.get("/vehicles", getMyVehicles);

// Get vendor's rentals
router.get("/rentals", getMyRentals);

// Get vendor's revenue stats
router.get("/revenue", getMyRevenue);

export default router;

