import Booking from "../models/booking.model.js";
import Vehicle from "../models/vehicle.model.js";
import User from "../models/user.model.js";

export const createBooking = async (req, res) => {
    try {
        const { vehicleId, startDate, endDate, isPaymentDeferred } = req.body;
        const userId = req.userId;

        // Check if user is vendor or admin - they cannot book vehicles
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (req.user.role === "vendor" || req.user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Vendors and admins cannot book vehicles"
            });
        }

        if (!vehicleId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Vehicle ID, start date, and end date are required"
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return res.status(400).json({
                success: false,
                message: "Start date cannot be in the past"
            });
        }

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date"
            });
        }

        // Check if vehicle exists and is available
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        if (vehicle.status !== "available") {
            return res.status(400).json({
                success: false,
                message: "Vehicle is not available for booking"
            });
        }

        // Check if vehicle is approved
        if (vehicle.verificationStatus !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Vehicle is not approved for booking"
            });
        }

        // Check if user has approved license for this vehicle type
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const approvedLicense = user.licenses.find(
            license => license.vehicleTypes?.includes(vehicle.category) && license.status === "approved"
        );

        if (!approvedLicense) {
            return res.status(403).json({
                success: false,
                message: `You need an approved ${vehicle.category} license to book this vehicle. Please upload your license and wait for admin approval.`
            });
        }

        // Check for overlapping bookings
        const overlappingBookings = await Booking.find({
            vehicleId,
            bookingStatus: { $in: ["pending", "confirmed", "active"] },
            $or: [
                {
                    startDate: { $lte: end },
                    endDate: { $gte: start }
                }
            ]
        });

        if (overlappingBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Vehicle is already booked for the selected dates"
            });
        }

        // Calculate total days and amount
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const totalAmount = totalDays * vehicle.pricePerDay;

        // Create booking
        const booking = await Booking.create({
            userId,
            vehicleId,
            startDate: start,
            endDate: end,
            totalDays,
            pricePerDay: vehicle.pricePerDay,
            totalAmount,
            paymentMethod: "esewa",
            paymentStatus: isPaymentDeferred ? "pending" : "pending",
            bookingStatus: isPaymentDeferred ? "pending" : "pending", // Always pending until payment is confirmed
            pickupLocation: vehicle.pickupLocation,
            isPaymentDeferred
        });

        res.status(201).json({
            success: true,
            message: "Booking created. Please complete payment via eSewa to confirm your booking.",
            data: booking
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create booking"
        });
    }
};

export const getUserBookings = async (req, res) => {
    try {
        const userId = req.userId;
        const bookings = await Booking.find({ userId })
            .populate("vehicleId", "name mainImage category")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings"
        });
    }
};

export const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const booking = await Booking.findOne({ _id: id, userId })
            .populate("vehicleId")
            .populate("userId", "name email contact");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking"
        });
    }
};

export const completePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const booking = await Booking.findOne({ _id: id, userId });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        if (booking.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "Payment already completed"
            });
        }

        // Payment should be completed through eSewa payment flow
        // This endpoint is kept for backward compatibility but redirects to initiate payment
        return res.status(400).json({
            success: false,
            message: "Please initiate payment through eSewa. Use /api/payments/esewa/initiate endpoint.",
            redirectTo: `/api/payments/esewa/initiate`
        });
    } catch (error) {
        console.error("Error completing payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to complete payment"
        });
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const booking = await Booking.findOne({ _id: id, userId });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        if (booking.bookingStatus === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled"
            });
        }

        booking.bookingStatus = "cancelled";
        await booking.save();

        // Mark vehicle as available again
        await Vehicle.findByIdAndUpdate(booking.vehicleId, { isAvailable: true });

        res.json({
            success: true,
            message: "Booking cancelled successfully",
            data: booking
        });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel booking"
        });
    }
};

/**
 * Check vehicle availability for a date range
 * This endpoint doesn't require authentication for checking availability
 */
export const checkAvailability = async (req, res) => {
    try {
        const { vehicleId, startDate, endDate } = req.query;

        if (!vehicleId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Vehicle ID, start date, and end date are required"
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return res.status(400).json({
                success: false,
                message: "Start date cannot be in the past"
            });
        }

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date"
            });
        }

        // Check if vehicle exists and is available
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        if (!vehicle.status=="available") {
            return res.json({
                success: true,
                available: false,
                message: "Vehicle is not available for booking",
                reason: "vehicle_unavailable"
            });
        }

        // Check for overlapping bookings
        const overlappingBookings = await Booking.find({
            vehicleId,
            bookingStatus: { $in: ["pending", "confirmed", "active"] },
            $or: [
                {
                    startDate: { $lte: end },
                    endDate: { $gte: start }
                }
            ]
        });

        if (overlappingBookings.length > 0) {
            // Get all booked date ranges for display
            const bookedRanges = overlappingBookings.map(booking => ({
                startDate: booking.startDate,
                endDate: booking.endDate
            }));

            return res.json({
                success: true,
                available: false,
                message: "Vehicle is already booked for the selected dates",
                reason: "date_conflict",
                bookedRanges
            });
        }

        // Get all existing bookings to show unavailable dates
        const allBookings = await Booking.find({
            vehicleId,
            bookingStatus: { $in: ["pending", "confirmed", "active"] }
        }).select("startDate endDate").sort({ startDate: 1 });

        const bookedRanges = allBookings.map(booking => ({
            startDate: booking.startDate,
            endDate: booking.endDate
        }));

        res.json({
            success: true,
            available: true,
            message: "Vehicle is available for the selected dates",
            bookedRanges
        });
    } catch (error) {
        console.error("Error checking availability:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to check availability"
        });
    }
};

