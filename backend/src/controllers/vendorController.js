import VendorApplication from "../models/vendorApplication.model.js";
import Vehicle from "../models/vehicle.model.js";
import Rental from "../models/rental.model.js";
import User from "../models/user.model.js";
import sendEmail from "../utils/emailTemplates.js";

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
        const { otherDocuments } = req.body;
        let documentsArray = [];
        if (otherDocuments) {
            documentsArray = Array.isArray(otherDocuments) ? otherDocuments : [otherDocuments];
        }

        // Get user details for email
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
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

        // Send email notification to all admins
        try {
            const admins = await User.find({ role: "admin" }).select("email");
            const reviewLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/admin/vendors`;
            
            // Send email to each admin
            const emailPromises = admins.map(admin => 
                sendEmail(admin.email, "vendor-application-submitted-admin", {
                    userName: user.name,
                    userEmail: user.email,
                    reviewLink: reviewLink
                }).catch(error => {
                    console.error(`Failed to send email to admin ${admin.email}:`, error);
                    // Don't throw - continue with other admins
                })
            );
            
            await Promise.allSettled(emailPromises);
        } catch (emailError) {
            console.error("Error sending admin notification emails:", emailError);
            // Don't fail the application submission if email fails
        }

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

// Upload vehicle
export const uploadVehicle = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, type, description, pricePerDay, location, condition, specifications } = req.body;
        const bluebook = req.body.bluebook;
        const vehicleImages = req.body.vehicleImages;

        // Verify user is a vendor
        const user = await User.findById(userId);
        if (!user || user.role !== "vendor") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Vendor privileges required."
            });
        }

        // Validation
        if (!name || !type || !pricePerDay || !bluebook || !condition) {
            return res.status(400).json({
                success: false,
                message: "Name, type, price per day, bluebook, and condition are required"
            });
        }

        // Validate condition enum
        const validConditions = ["excellent", "good", "fair", "poor"];
        if (!validConditions.includes(condition)) {
            return res.status(400).json({
                success: false,
                message: "Condition must be one of: excellent, good, fair, poor"
            });
        }

        // Validate vehicle images
        let imagesArray = [];
        if (vehicleImages) {
            imagesArray = Array.isArray(vehicleImages) ? vehicleImages : [vehicleImages];
        }

        if (imagesArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one vehicle image is required"
            });
        }

        // Validate price
        const price = parseFloat(pricePerDay);
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price per day must be a positive number"
            });
        }

        // Parse specifications if provided
        let specsMap = {};
        if (specifications) {
            try {
                specsMap = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid specifications format"
                });
            }
        }

        // Create vehicle
        const vehicle = await Vehicle.create({
            vendorId: userId,
            name: name.trim(),
            type,
            description: description?.trim() || "",
            pricePerDay: price,
            location: location?.trim() || "",
            images: imagesArray,
            bluebook,
            condition,
            specifications: specsMap,
            approvalStatus: "pending",
            status: "inactive" // Set to inactive until approved
        });

        // Send email notification to admin
        try {
            const adminEmail = process.env.SMTP_MAIL;
            const reviewLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/admin/vehicles`;
            
            // Send email to admin
            sendEmail(adminEmail, "vehicle-uploaded-admin", {
                    vendorName: user.name,
                    vendorEmail: user.email,
                    vehicleName: vehicle.name,
                    vehicleType: vehicle.type,
                    vehicleCondition: vehicle.condition,
                    reviewLink: reviewLink,
                    vehicleImages: imagesArray
                });
        } catch (emailError) {
            console.error("Error sending admin notification emails:", emailError);
            // Don't fail the vehicle upload if email fails
        }

        return res.status(201).json({
            success: true,
            message: "Vehicle uploaded successfully. Please wait for admin approval.",
            vehicle: {
                id: vehicle._id,
                name: vehicle.name,
                type: vehicle.type,
                approvalStatus: vehicle.approvalStatus,
                createdAt: vehicle.createdAt
            }
        });
    } catch (error) {
        console.error("Upload vehicle error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload vehicle"
        });
    }
};

// Update vehicle (for rejected vehicles to resubmit)
export const updateVehicle = async (req, res) => {
    try {
        const userId = req.userId;
        const { vehicleId } = req.params;
        const { name, type, description, pricePerDay, location, condition, specifications } = req.body;
        const bluebook = req.body.bluebook;
        const vehicleImages = req.body.vehicleImages;

        // Verify user is a vendor
        const user = await User.findById(userId);
        if (!user || user.role !== "vendor") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Vendor privileges required."
            });
        }

        // Find the vehicle and verify ownership
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        if (vehicle.vendorId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only edit your own vehicles."
            });
        }

        // Only allow editing rejected vehicles
        if (vehicle.approvalStatus !== "rejected") {
            return res.status(400).json({
                success: false,
                message: "Only rejected vehicles can be edited and resubmitted"
            });
        }

        // Validation
        if (!name || !type || !pricePerDay || !condition) {
            return res.status(400).json({
                success: false,
                message: "Name, type, price per day, and condition are required"
            });
        }

        // Validate condition enum
        const validConditions = ["excellent", "good", "fair", "poor"];
        if (!validConditions.includes(condition)) {
            return res.status(400).json({
                success: false,
                message: "Condition must be one of: excellent, good, fair, poor"
            });
        }

        // Validate vehicle images
        let imagesArray = vehicle.images || [];
        if (vehicleImages && vehicleImages.length > 0) {
            imagesArray = Array.isArray(vehicleImages) ? vehicleImages : [vehicleImages];
        }

        if (imagesArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one vehicle image is required"
            });
        }

        // Validate price
        const price = parseFloat(pricePerDay);
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price per day must be a positive number"
            });
        }

        // Parse specifications if provided
        let specsMap = vehicle.specifications || {};
        if (specifications) {
            try {
                specsMap = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid specifications format"
                });
            }
        }

        // Update vehicle
        vehicle.name = name.trim();
        vehicle.type = type;
        vehicle.description = description?.trim() || "";
        vehicle.pricePerDay = price;
        vehicle.location = location?.trim() || "";
        vehicle.images = imagesArray;
        vehicle.condition = condition;
        vehicle.specifications = specsMap;
        
        // Update bluebook if provided
        if (bluebook) {
            vehicle.bluebook = bluebook;
        }

        // Reset approval status for resubmission
        vehicle.approvalStatus = "pending";
        vehicle.rejectionMessage = "";
        vehicle.reviewedBy = null;
        vehicle.reviewedAt = null;
        vehicle.status = "inactive"; // Set to inactive until approved

        await vehicle.save();

        // Send email notification to all admins
        try {
            const admins = process.env.SMTP_MAIL;
            const reviewLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/admin/vehicles`;
            
            // Send email to admin
            sendEmail(admins, "vehicle-uploaded-admin", {
                    vendorName: user.name,
                    vendorEmail: user.email,
                    vehicleName: vehicle.name,
                    vehicleType: vehicle.type,
                    vehicleCondition: vehicle.condition,
                    reviewLink: reviewLink,
                    vehicleImages: imagesArray
                });
        } catch (emailError) {
            console.error("Error sending admin notification emails:", emailError);
            // Don't fail the vehicle update if email fails
        }

        return res.status(200).json({
            success: true,
            message: "Vehicle updated and resubmitted successfully. Please wait for admin approval.",
            vehicle: {
                id: vehicle._id,
                name: vehicle.name,
                type: vehicle.type,
                approvalStatus: vehicle.approvalStatus,
                updatedAt: vehicle.updatedAt
            }
        });
    } catch (error) {
        console.error("Update vehicle error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update vehicle"
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

