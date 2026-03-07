import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { 
    createBooking, 
    getUserBookings, 
    getBookingById, 
    // completePayment, 
    cancelBooking,
    checkAvailability,
    getVendorBookings,
    uploadPreRentalImages,
    uploadUserPostRentalImages,
    uploadVendorPostRentalImages,
    uploadPostRentalImages,
    compareBookingCondition
} from "../controllers/bookingController.js";
import userAuth from "../middlewares/userAuth.js";

const router = express.Router();

// Configure Cloudinary storage for post-rental images
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "wheelify/post-rental-images",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [
            { width: 1024, height: 1024, crop: "limit", quality: "auto" },
        ],
    },
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    }
});

// Public route - doesn't require authentication
router.get("/check-availability", checkAvailability);

// All other booking routes require authentication
router.use(userAuth);

router.post("/create", createBooking);
router.get("/my-bookings", getUserBookings);
router.get("/vendor-bookings", getVendorBookings);
router.get("/:id", getBookingById);
// router.post("/:id/complete-payment", completePayment);
router.post("/:id/cancel", cancelBooking);

// Upload pre-rental images route (for vendors)
router.post("/:bookingId/upload-pre-rental-images",
    upload.array('preRentalImages', 10), // Allow up to 10 images
    async (req, res, next) => {
        try {
            // Extract file URLs from Cloudinary
            const files = req.files;
            
            if (files && files.length > 0) {
                const preRentalImages = files.map(file => file.path);
                req.body.preRentalImages = preRentalImages;
            }
            
            next();
        } catch (error) {
            console.error("File upload error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to upload images"
            });
        }
    },
    uploadPreRentalImages
);

// Compare vehicle condition using Gemini (vendor only)
router.post("/:bookingId/compare-condition", compareBookingCondition);

// Upload user post-rental images route
router.post("/:bookingId/upload-user-post-rental-images",
    upload.array('userPostRentalImages', 10), // Allow up to 10 images
    async (req, res, next) => {
        try {
            // Extract file URLs from Cloudinary
            const files = req.files;
            
            if (files && files.length > 0) {
                const userPostRentalImages = files.map(file => file.path);
                req.body.userPostRentalImages = userPostRentalImages;
            }
            
            next();
        } catch (error) {
            console.error("File upload error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to upload images"
            });
        }
    },
    uploadUserPostRentalImages
);

// Upload vendor post-rental images route
router.post("/:bookingId/upload-vendor-post-rental-images",
    upload.array('vendorPostRentalImages', 10), // Allow up to 10 images
    async (req, res, next) => {
        try {
            // Extract file URLs from Cloudinary
            const files = req.files;
            
            if (files && files.length > 0) {
                const vendorPostRentalImages = files.map(file => file.path);
                req.body.vendorPostRentalImages = vendorPostRentalImages;
            }
            
            next();
        } catch (error) {
            console.error("File upload error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to upload images"
            });
        }
    },
    uploadVendorPostRentalImages
);

// Upload post-rental images route (legacy - for backward compatibility)
router.post("/:bookingId/upload-post-rental-images",
    upload.array('postRentalImages', 10), // Allow up to 10 images
    async (req, res, next) => {
        try {
            // Extract file URLs from Cloudinary
            const files = req.files;
            
            if (files && files.length > 0) {
                const postRentalImages = files.map(file => file.path);
                req.body.postRentalImages = postRentalImages;
            }
            
            next();
        } catch (error) {
            console.error("File upload error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to upload images"
            });
        }
    },
    uploadPostRentalImages
);

export default router;

