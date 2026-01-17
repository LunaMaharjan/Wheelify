import User from "../models/user.model.js";
import VendorApplication from "../models/vendorApplication.model.js";
import Vehicle from "../models/vehicle.model.js";
import Booking from "../models/booking.model.js";
import sendEmail from "../utils/emailTemplates.js";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalVendors = await User.countDocuments({ role: "vendor" });
        const verifiedUsers = await User.countDocuments({
            role: "user",
            isAccountVerified: true,
        });
        const pendingVendors = await User.countDocuments({
            role: "vendor",
            isAccountVerified: false,
        });

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalVendors,
                verifiedUsers,
                pendingVendors,
            },
        });
    } catch (error) {
        console.error("Get dashboard stats error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch dashboard statistics",
        });
    }
};

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "user" })
            .select("-password -verificationToken -verificationTokenExpireAt")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        console.error("Get all users error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch users",
        });
    }
};

// Delete a user
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Prevent deleting admin users
        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Cannot delete admin users",
            });
        }

        await User.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete user",
        });
    }
};

// Toggle user verification
export const toggleUserVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { isAccountVerified } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (typeof isAccountVerified !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isAccountVerified must be a boolean",
            });
        }

        user.isAccountVerified = isAccountVerified;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `User ${isAccountVerified ? "verified" : "unverified"} successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAccountVerified: user.isAccountVerified,
            },
        });
    } catch (error) {
        console.error("Toggle user verification error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update user verification",
        });
    }
};

// Get all vendors
export const getAllVendors = async (req, res) => {
    try {
        const vendors = await User.find({ role: "vendor" })
            .select("-password -verificationToken -verificationTokenExpireAt")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            vendors,
        });
    } catch (error) {
        console.error("Get all vendors error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch vendors",
        });
    }
};

// Approve a vendor
export const approveVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body || {};
        const adminId = req.userId;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Vendor ID is required",
            });
        }

        const vendor = await User.findById(id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
        }

        if (vendor.role !== "vendor") {
            return res.status(400).json({
                success: false,
                message: "User is not a vendor",
            });
        }

        // Update vendor status
        vendor.isAccountVerified = true;
        await vendor.save();

        // Update application status
        const application = await VendorApplication.findOne({ userId: id });
        if (application) {
            application.status = "approved";
            application.reviewedBy = adminId;
            application.reviewedAt = new Date();
            await application.save();
        }

        // Send approval email
        try {
            await sendEmail(vendor.email, "vendor-approved", {
                vendorName: vendor.name,
                message: message || "Your vendor application has been approved. You can now access the vendor dashboard."
            });
        } catch (emailError) {
            console.error("Error sending approval email:", emailError);
            // Don't fail the approval if email fails
        }

        return res.status(200).json({
            success: true,
            message: "Vendor approved successfully",
            vendor: {
                id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                role: vendor.role,
                isAccountVerified: vendor.isAccountVerified,
            },
        });
    } catch (error) {
        console.error("Approve vendor error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to approve vendor",
        });
    }
};

// Reject a vendor
export const rejectVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body || {};
        const adminId = req.userId;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Vendor ID is required",
            });
        }

        if (!message || message.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Rejection message is required",
            });
        }

        const vendor = await User.findById(id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
        }

        if (vendor.role !== "vendor") {
            return res.status(400).json({
                success: false,
                message: "User is not a vendor",
            });
        }

        // Update vendor status
        vendor.isAccountVerified = false;
        await vendor.save();

        // Update application status
        const application = await VendorApplication.findOne({ userId: id });
        if (application) {
            application.status = "rejected";
            application.rejectionMessage = message;
            application.reviewedBy = adminId;
            application.reviewedAt = new Date();
            await application.save();
        }

        // Send rejection email
        try {
            await sendEmail(vendor.email, "vendor-rejected", {
                vendorName: vendor.name,
                message: message
            });
        } catch (emailError) {
            console.error("Error sending rejection email:", emailError);
            // Don't fail the rejection if email fails
        }

        return res.status(200).json({
            success: true,
            message: "Vendor rejected successfully",
        });
    } catch (error) {
        console.error("Reject vendor error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to reject vendor",
        });
    }
};

// Toggle vendor verification
export const toggleVendorVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { isAccountVerified } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Vendor ID is required",
            });
        }

        const vendor = await User.findById(id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
        }

        if (vendor.role !== "vendor") {
            return res.status(400).json({
                success: false,
                message: "User is not a vendor",
            });
        }

        if (typeof isAccountVerified !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isAccountVerified must be a boolean",
            });
        }

        vendor.isAccountVerified = isAccountVerified;
        await vendor.save();

        return res.status(200).json({
            success: true,
            message: `Vendor ${isAccountVerified ? "verified" : "unverified"} successfully`,
            vendor: {
                id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                role: vendor.role,
                isAccountVerified: vendor.isAccountVerified,
            },
        });
    } catch (error) {
        console.error("Toggle vendor verification error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update vendor verification",
        });
    }
};

// Get all vendor applications
export const getVendorApplications = async (req, res) => {
    try {
        const applications = await VendorApplication.find()
            .populate("userId", "name email role contact address image")
            .populate("reviewedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            applications,
        });
    } catch (error) {
        console.error("Get vendor applications error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch vendor applications",
        });
    }
};

// Get specific vendor application details
export const getVendorApplicationDetails = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Vendor ID is required",
            });
        }

        // Try to find by application ID first, then by userId
        let application = await VendorApplication.findById(id)
            .populate("userId", "name email role contact address image")
            .populate("reviewedBy", "name email");

        // If not found by ID, try finding by userId
        if (!application) {
            application = await VendorApplication.findOne({ userId: id })
                .populate("userId", "name email role contact address image")
                .populate("reviewedBy", "name email");
        }

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        return res.status(200).json({
            success: true,
            application,
        });
    } catch (error) {
        console.error("Get application details error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch application details",
        });
    }
};

// Get all vehicles
export const getAllVehicles = async (req, res) => {
    try {
        const { approvalStatus } = req.query;
        
        let query = {};
        if (approvalStatus) {
            query.approvalStatus = approvalStatus;
        }

        const vehicles = await Vehicle.find(query)
            .populate("vendorId", "name email role contact address")
            .populate("reviewedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            vehicles,
            count: vehicles.length
        });
    } catch (error) {
        console.error("Get all vehicles error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch vehicles",
        });
    }
};

// Approve a vehicle
export const approveVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.userId;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Vehicle ID is required",
            });
        }

        const vehicle = await Vehicle.findById(id).populate("vendorId", "name email");

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found",
            });
        }

        if (vehicle.approvalStatus !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Vehicle is already ${vehicle.approvalStatus}`,
            });
        }

        // Update vehicle status
        vehicle.approvalStatus = "approved";
        vehicle.status = "available"; // Make it available for rental
        vehicle.reviewedBy = adminId;
        vehicle.reviewedAt = new Date();
        await vehicle.save();

        // Send approval email to vendor
        if (vehicle.vendorId && vehicle.vendorId.email) {
            try {
                await sendEmail(vehicle.vendorId.email, "vehicle-approved-vendor", {
                    vendorName: vehicle.vendorId.name,
                    vehicleName: vehicle.name,
                    vehicleType: vehicle.type
                });
            } catch (emailError) {
                console.error("Error sending approval email:", emailError);
                // Don't fail the approval if email fails
            }
        }

        return res.status(200).json({
            success: true,
            message: "Vehicle approved successfully",
            vehicle: {
                id: vehicle._id,
                name: vehicle.name,
                type: vehicle.type,
                approvalStatus: vehicle.approvalStatus,
                status: vehicle.status
            },
        });
    } catch (error) {
        console.error("Approve vehicle error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to approve vehicle",
        });
    }
};

// Reject a vehicle
export const rejectVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body || {};
        const adminId = req.userId;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Vehicle ID is required",
            });
        }

        if (!message || message.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Rejection message is required",
            });
        }

        const vehicle = await Vehicle.findById(id).populate("vendorId", "name email");

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found",
            });
        }

        if (vehicle.approvalStatus !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Vehicle is already ${vehicle.approvalStatus}`,
            });
        }

        // Update vehicle status
        vehicle.approvalStatus = "rejected";
        vehicle.status = "inactive"; // Set to inactive so it cannot be rented
        vehicle.rejectionMessage = message.trim();
        vehicle.reviewedBy = adminId;
        vehicle.reviewedAt = new Date();
        await vehicle.save();

        // Send rejection email to vendor
        if (vehicle.vendorId && vehicle.vendorId.email) {
            try {
                await sendEmail(vehicle.vendorId.email, "vehicle-rejected-vendor", {
                    vendorName: vehicle.vendorId.name,
                    vehicleName: vehicle.name,
                    vehicleType: vehicle.type,
                    rejectionMessage: message.trim()
                });
            } catch (emailError) {
                console.error("Error sending rejection email:", emailError);
                // Don't fail the rejection if email fails
            }
        }

        return res.status(200).json({
            success: true,
            message: "Vehicle rejected successfully",
        });
    } catch (error) {
        console.error("Reject vehicle error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to reject vehicle",
        });
    }
};

// Get all bookings
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("userId", "name email contact")
            .populate("vehicleId", "name category mainImage pricePerDay")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            bookings,
        });
    } catch (error) {
        console.error("Get all bookings error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch bookings",
        });
    }
};
