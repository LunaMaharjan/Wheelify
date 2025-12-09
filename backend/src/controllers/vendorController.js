import VendorApplication from "../models/vendorApplication.model.js";
import Vehicle from "../models/vehicle.model.js";
import Rental from "../models/rental.model.js";
import User from "../models/user.model.js";

// Submit vendor application
export const submitApplication = async (req, res) => {
    try {
        const userId = req.userId;
        const { citizenshipFront, citizenshipBack } = req.body;

        // Validation
        if (!citizenshipFront || !citizenshipBack) {
            return res.status(400).json({
                success: false,
                message: "Citizenship front and back images are required"
            });
        }

        // Check if user already has an application
        const existingApplication = await VendorApplication.findOne({ userId });
        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: "You already have a vendor application. Please wait for review."
            });
        }

        // Parse otherDocuments if it's a string (from form data)
        let documentsArray = [];
        if (otherDocuments) {
            documentsArray = Array.isArray(otherDocuments) ? otherDocuments : [otherDocuments];
        }

        // Create application
        const application = await VendorApplication.create({
            userId,
            citizenshipFront,
            citizenshipBack,
            otherDocuments: documentsArray
        });

        // Update user role to vendor (but keep isAccountVerified as false until approved)
        await User.findByIdAndUpdate(userId, {
            role: "vendor",
            isAccountVerified: false
        });

        return res.status(201).json({
            success: true,
            message: "Vendor application submitted successfully. Please wait for admin approval.",
            application: {
                id: application._id,
                status: application.status,
                createdAt: application.createdAt
            }
        });
    } catch (error) {
        console.error("Submit application error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to submit vendor application"
        });
    }
};

// Get current user's application
export const getMyApplication = async (req, res) => {
    try {
        const userId = req.userId;

        const application = await VendorApplication.findOne({ userId })
            .populate("userId", "name email role isAccountVerified")
            .populate("reviewedBy", "name email");

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "No vendor application found"
            });
        }

        return res.status(200).json({
            success: true,
            application
        });
    } catch (error) {
        console.error("Get application error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch application"
        });
    }
};

// Get vendor's vehicles
export const getMyVehicles = async (req, res) => {
    try {
        const userId = req.userId;

        // Verify user is a vendor
        const user = await User.findById(userId);
        if (!user || user.role !== "vendor") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Vendor privileges required."
            });
        }

        const vehicles = await Vehicle.find({ vendorId: userId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            vehicles,
            count: vehicles.length
        });
    } catch (error) {
        console.error("Get vehicles error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch vehicles"
        });
    }
};

// Get vendor's rentals
export const getMyRentals = async (req, res) => {
    try {
        const userId = req.userId;

        // Verify user is a vendor
        const user = await User.findById(userId);
        if (!user || user.role !== "vendor") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Vendor privileges required."
            });
        }

        const rentals = await Rental.find({ vendorId: userId })
            .populate("vehicleId", "name type images")
            .populate("customerId", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            rentals,
            count: rentals.length
        });
    } catch (error) {
        console.error("Get rentals error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch rentals"
        });
    }
};

// Get vendor's revenue stats
export const getMyRevenue = async (req, res) => {
    try {
        const userId = req.userId;

        // Verify user is a vendor
        const user = await User.findById(userId);
        if (!user || user.role !== "vendor") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Vendor privileges required."
            });
        }

        const rentals = await Rental.find({ 
            vendorId: userId,
            status: { $in: ["confirmed", "active", "completed"] },
            paymentStatus: "paid"
        });

        const totalRevenue = rentals.reduce((sum, rental) => sum + rental.totalPrice, 0);
        const completedRentals = rentals.filter(r => r.status === "completed").length;
        const activeRentals = rentals.filter(r => r.status === "active").length;

        // Calculate monthly revenue (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyRevenue = rentals
            .filter(r => r.createdAt >= thirtyDaysAgo)
            .reduce((sum, rental) => sum + rental.totalPrice, 0);

        return res.status(200).json({
            success: true,
            revenue: {
                total: totalRevenue,
                monthly: monthlyRevenue,
                completedRentals,
                activeRentals,
                totalRentals: rentals.length
            }
        });
    } catch (error) {
        console.error("Get revenue error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch revenue"
        });
    }
};

