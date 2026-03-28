import Booking from "../models/booking.model.js";
import Vehicle from "../models/vehicle.model.js";
import User from "../models/user.model.js";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function fetchImageAsBase64(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
}

const EMPTY_CONDITION_COMPARISON = {
    overallAssessment: "",
    damageSummary: [],
    recommendedActions: "",
    isSafeToRentAgain: null,
    notesForVendor: ""
};

function stripJsonCodeFences(text) {
    let t = String(text || "").trim();
    if (t.startsWith("```")) {
        t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/s, "");
    }
    return t.trim();
}

/** Decode JSON string content after opening `"` (handles truncation before closing quote). */
function readJsonStringContentAfterOpenQuote(src) {
    let i = 0;
    let out = "";
    while (i < src.length) {
        const c = src[i];
        if (c === "\\" && i + 1 < src.length) {
            const n = src[i + 1];
            if (n === '"') {
                out += '"';
                i += 2;
                continue;
            }
            if (n === "\\") {
                out += "\\";
                i += 2;
                continue;
            }
            if (n === "n") {
                out += "\n";
                i += 2;
                continue;
            }
            if (n === "r") {
                out += "\r";
                i += 2;
                continue;
            }
            if (n === "t") {
                out += "\t";
                i += 2;
                continue;
            }
            if (
                n === "u" &&
                i + 5 < src.length &&
                /^[0-9a-fA-F]{4}$/.test(src.slice(i + 2, i + 6))
            ) {
                out += String.fromCharCode(
                    Number.parseInt(src.slice(i + 2, i + 6), 16)
                );
                i += 6;
                continue;
            }
            out += n;
            i += 2;
            continue;
        }
        if (c === '"') {
            return out;
        }
        out += c;
        i++;
    }
    return out;
}

/** Try to read "overallAssessment" when the payload is truncated or invalid JSON. */
function salvageOverallAssessmentFromPartialJson(text) {
    const keyIdx = text.indexOf('"overallAssessment"');
    if (keyIdx === -1) {
        return null;
    }
    const afterKey = text.slice(keyIdx + '"overallAssessment"'.length);
    const colon = afterKey.indexOf(":");
    if (colon === -1) {
        return null;
    }
    let rest = afterKey.slice(colon + 1).trim();
    if (!rest.startsWith('"')) {
        return null;
    }
    return readJsonStringContentAfterOpenQuote(rest.slice(1));
}

/**
 * Parse Gemini JSON output into a flat { overallAssessment, damageSummary, ... } object.
 * Handles code fences, truncated output, and JSON embedded in overallAssessment.
 */
function parseConditionComparisonResponse(rawText) {
    const text = stripJsonCodeFences(rawText || "");
    if (!text) {
        return {
            ...EMPTY_CONDITION_COMPARISON,
            overallAssessment: "Empty model response.",
            notesForVendor: "The model returned no text."
        };
    }

    let parsed = null;
    try {
        parsed = JSON.parse(text);
    } catch {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end > start) {
            try {
                parsed = JSON.parse(text.slice(start, end + 1));
            } catch {
                parsed = null;
            }
        }
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        const salvaged = salvageOverallAssessmentFromPartialJson(text);
        return {
            ...EMPTY_CONDITION_COMPARISON,
            overallAssessment:
                salvaged ||
                text.slice(0, 12000) ||
                "Could not parse model response as JSON.",
            notesForVendor:
                "Response was not valid JSON (often truncated). Try Compare again or contact support.",
            recommendedActions: ""
        };
    }

    return normalizeConditionComparisonShape(parsed);
}

function normalizeConditionComparisonShape(input) {
    let o = { ...EMPTY_CONDITION_COMPARISON, ...input };

    for (let i = 0; i < 6; i++) {
        const oa = o.overallAssessment;
        if (typeof oa !== "string") {
            if (oa != null) o.overallAssessment = String(oa);
            break;
        }
        const trimmed = oa.trim();
        if (!trimmed.startsWith("{")) {
            break;
        }
        try {
            const inner = JSON.parse(trimmed);
            if (inner && typeof inner === "object" && !Array.isArray(inner)) {
                o = {
                    ...o,
                    ...inner,
                    damageSummary: Array.isArray(inner.damageSummary)
                        ? inner.damageSummary
                        : Array.isArray(o.damageSummary)
                          ? o.damageSummary
                          : [],
                    overallAssessment:
                        typeof inner.overallAssessment === "string"
                            ? inner.overallAssessment
                            : o.overallAssessment
                };
                continue;
            }
        } catch {
            const salvaged = salvageOverallAssessmentFromPartialJson(trimmed);
            if (salvaged) {
                o.overallAssessment = salvaged;
            }
            break;
        }
        break;
    }

    if (!Array.isArray(o.damageSummary)) {
        o.damageSummary = [];
    }
    if (typeof o.overallAssessment !== "string") {
        o.overallAssessment =
            o.overallAssessment != null ? String(o.overallAssessment) : "";
    }
    if (typeof o.recommendedActions !== "string") {
        o.recommendedActions =
            o.recommendedActions != null ? String(o.recommendedActions) : "";
    }
    if (typeof o.notesForVendor !== "string") {
        o.notesForVendor =
            o.notesForVendor != null ? String(o.notesForVendor) : "";
    }
    if (
        o.isSafeToRentAgain !== null &&
        typeof o.isSafeToRentAgain !== "boolean"
    ) {
        o.isSafeToRentAgain = null;
    }

    return o;
}

async function compareConditionWithGemini(preImageUrls, postImageUrls) {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured on the server");
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Limit number of images to keep payload reasonable
    const preUrls = preImageUrls.slice(0, 4);
    const postUrls = postImageUrls.slice(0, 4);

    const preImagesBase64 = await Promise.all(preUrls.map(fetchImageAsBase64));
    const postImagesBase64 = await Promise.all(postUrls.map(fetchImageAsBase64));

    const prompt = `
You are an expert vehicle inspector.
You are given BEFORE and AFTER rental photos of the same vehicle.
Carefully compare them and describe any new damage, scratches, dents, interior issues, or missing parts.

Return your answer STRICTLY as JSON with this exact structure:
{
  "overallAssessment": string,
  "damageSummary": [
    {
      "area": string,
      "severity": "none" | "low" | "medium" | "high",
      "description": string
    }
  ],
  "recommendedActions": string,
  "isSafeToRentAgain": boolean,
  "notesForVendor": string
}

If there is no noticeable new damage, set "damageSummary" to an empty array and explain that in "overallAssessment".
`;

    const parts = [
        { text: prompt },
        { text: "BEFORE (pre-rental) photos:" },
        ...preImagesBase64.map((data) => ({
            inlineData: {
                mimeType: "image/jpeg",
                data
            }
        })),
        { text: "AFTER (post-rental) photos:" },
        ...postImagesBase64.map((data) => ({
            inlineData: {
                mimeType: "image/jpeg",
                data
            }
        }))
    ];

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: parts,
        config: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
        }
    });

    const text = response.text || "";
    const parsedJson = parseConditionComparisonResponse(text);

    return {
        rawText: text,
        json: parsedJson,
        model: response.modelVersion || "gemini-3-flash-preview"
    };
}

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

export const getVendorBookings = async (req, res) => {
    try {
        const vendorId = req.userId;

        // Verify user is a vendor
        const user = await User.findById(vendorId);
        if (!user || user.role !== "vendor") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Vendor privileges required."
            });
        }

        // Get all vehicles owned by this vendor
        const vendorVehicles = await Vehicle.find({ vendorId }).select("_id");
        const vehicleIds = vendorVehicles.map(v => v._id);

        // Get all bookings for these vehicles
        const bookings = await Booking.find({ vehicleId: { $in: vehicleIds } })
            .populate("userId", "name email contact")
            .populate("vehicleId", "name category mainImage pricePerDay")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error("Error fetching vendor bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch vendor bookings"
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

export const compareBookingCondition = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.userId;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required"
            });
        }

        const booking = await Booking.findById(bookingId)
            .populate("vehicleId", "name vendorId")
            .populate("userId", "name email");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Only the vendor who owns the vehicle can perform the comparison
        if (booking.vehicleId.vendorId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only compare condition for your own vehicles"
            });
        }

        if (!booking.preRentalImages || booking.preRentalImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Pre-rental images are required for comparison"
            });
        }

        if (!booking.vendorPostRentalImages || booking.vendorPostRentalImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Vendor post-rental images are required for comparison"
            });
        }

        const result = await compareConditionWithGemini(
            booking.preRentalImages,
            booking.vendorPostRentalImages
        );

        booking.conditionComparisonSummary = result.json?.overallAssessment || "";
        booking.conditionComparisonJson = result.json || null;
        booking.conditionComparisonModel =
            result.model || "gemini-3-flash-preview";
        booking.conditionComparisonUpdatedAt = new Date();

        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Condition comparison completed",
            data: {
                bookingId: booking._id,
                vehicleName: booking.vehicleId.name,
                customerName:
                    booking.userId.name || booking.userId.email || "",
                comparison: booking.conditionComparisonJson,
                summary: booking.conditionComparisonSummary,
                model: booking.conditionComparisonModel,
                updatedAt: booking.conditionComparisonUpdatedAt
            }
        });
    } catch (error) {
        console.error("Compare booking condition error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to compare vehicle condition"
        });
    }
}

// Upload pre-rental vehicle condition images by vendor
export const uploadPreRentalImages = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { conditionNotes } = req.body;
        const userId = req.userId;

        // Get uploaded images from cloudinary (set up by multer middleware)
        const preRentalImages = req.body.preRentalImages || [];

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required"
            });
        }

        if (preRentalImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one pre-rental image is required"
            });
        }

        // Find the booking and verify it's the vendor's vehicle
        const booking = await Booking.findById(bookingId)
            .populate('vehicleId', 'name vendorId')
            .populate('userId', 'name email');
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if user is the vendor who owns the vehicle
        if (booking.vehicleId.vendorId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only upload images for your own vehicles"
            });
        }

        // Check if booking is confirmed (ready for rental)
        if (booking.bookingStatus !== "confirmed") {
            return res.status(400).json({
                success: false,
                message: "You can only upload pre-rental images for confirmed bookings"
            });
        }

        // Check if images haven't been uploaded already
        if (booking.preRentalImages && booking.preRentalImages.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Pre-rental images have already been uploaded for this booking"
            });
        }

        // Update booking with pre-rental images
        booking.preRentalImages = preRentalImages;
        booking.preRentalImagesUploadedAt = new Date();
        if (conditionNotes) {
            booking.preRentalConditionNotes = conditionNotes.trim();
        }

        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Pre-rental images uploaded successfully",
            data: {
                bookingId: booking._id,
                vehicleName: booking.vehicleId.name,
                customerName: booking.userId.name,
                imagesCount: preRentalImages.length,
                uploadedAt: booking.preRentalImagesUploadedAt
            }
        });

    } catch (error) {
        console.error("Upload pre-rental images error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload pre-rental images"
        });
    }
};

// Upload post-rental vehicle condition images by user
export const uploadUserPostRentalImages = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { conditionNotes } = req.body;
        const userId = req.userId;

        // Get uploaded images from cloudinary (set up by multer middleware)
        const userPostRentalImages = req.body.userPostRentalImages || [];

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required"
            });
        }

        if (userPostRentalImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one post-rental image is required"
            });
        }

        // Find the booking and verify ownership
        const booking = await Booking.findById(bookingId).populate('vehicleId', 'name');
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if user owns this booking
        if (booking.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only upload images for your own bookings"
            });
        }

        // Check if booking is completed
        if (booking.bookingStatus !== "completed") {
            return res.status(400).json({
                success: false,
                message: "You can only upload post-rental images for completed bookings"
            });
        }

        // Check if images haven't been uploaded already
        if (booking.userPostRentalImages && booking.userPostRentalImages.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Post-rental images have already been uploaded for this booking"
            });
        }

        // Check if rental period has ended
        const now = new Date();
        if (new Date(booking.endDate) > now) {
            return res.status(400).json({
                success: false,
                message: "Cannot upload post-rental images before the rental period ends"
            });
        }

        // Update booking with user post-rental images
        booking.userPostRentalImages = userPostRentalImages;
        booking.userPostRentalImagesUploadedAt = new Date();
        if (conditionNotes) {
            booking.userPostRentalConditionNotes = conditionNotes.trim();
        }

        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Post-rental images uploaded successfully",
            data: {
                bookingId: booking._id,
                vehicleName: booking.vehicleId.name,
                imagesCount: userPostRentalImages.length,
                uploadedAt: booking.userPostRentalImagesUploadedAt
            }
        });

    } catch (error) {
        console.error("Upload user post-rental images error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload post-rental images"
        });
    }
};

// Upload post-rental vehicle condition images by vendor
export const uploadVendorPostRentalImages = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { conditionNotes } = req.body;
        const userId = req.userId;

        // Get uploaded images from cloudinary (set up by multer middleware)
        const vendorPostRentalImages = req.body.vendorPostRentalImages || [];

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required"
            });
        }

        if (vendorPostRentalImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one post-rental image is required"
            });
        }

        // Find the booking and verify it's the vendor's vehicle
        const booking = await Booking.findById(bookingId)
            .populate('vehicleId', 'name vendorId')
            .populate('userId', 'name email');
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if user is the vendor who owns the vehicle
        if (booking.vehicleId.vendorId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only upload images for your own vehicles"
            });
        }

        // Check if booking is not cancelled
        if (booking.bookingStatus === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot upload post-rental images for cancelled bookings"
            });
        }

        // Check if images haven't been uploaded already
        if (booking.vendorPostRentalImages && booking.vendorPostRentalImages.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Vendor post-rental images have already been uploaded for this booking"
            });
        }

        // Check if rental period has ended
        const now = new Date();
        if (new Date(booking.endDate) > now) {
            return res.status(400).json({
                success: false,
                message: "Cannot upload post-rental images before the rental period ends"
            });
        }

        // Update booking with vendor post-rental images
        booking.vendorPostRentalImages = vendorPostRentalImages;
        booking.vendorPostRentalImagesUploadedAt = new Date();
        if (conditionNotes) {
            booking.vendorPostRentalConditionNotes = conditionNotes.trim();
        }

        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Vendor post-rental images uploaded successfully",
            data: {
                bookingId: booking._id,
                vehicleName: booking.vehicleId.name,
                customerName: booking.userId.name,
                imagesCount: vendorPostRentalImages.length,
                uploadedAt: booking.vendorPostRentalImagesUploadedAt
            }
        });

    } catch (error) {
        console.error("Upload vendor post-rental images error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload vendor post-rental images"
        });
    }
};

// Upload post-rental vehicle condition images (legacy endpoint for backward compatibility)
export const uploadPostRentalImages = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { conditionNotes } = req.body;
        const userId = req.userId;

        // Get uploaded images from cloudinary (set up by multer middleware)
        const postRentalImages = req.body.postRentalImages || [];

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required"
            });
        }

        if (postRentalImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one post-rental image is required"
            });
        }

        // Find the booking and verify ownership
        const booking = await Booking.findById(bookingId).populate('vehicleId', 'name');
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if user owns this booking
        if (booking.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only upload images for your own bookings"
            });
        }

        // Check if booking is completed
        if (booking.bookingStatus !== "completed") {
            return res.status(400).json({
                success: false,
                message: "You can only upload post-rental images for completed bookings"
            });
        }

        // Check if images haven't been uploaded already
        if (booking.postRentalImages && booking.postRentalImages.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Post-rental images have already been uploaded for this booking"
            });
        }

        // Check if rental period has ended
        const now = new Date();
        if (new Date(booking.endDate) > now) {
            return res.status(400).json({
                success: false,
                message: "Cannot upload post-rental images before the rental period ends"
            });
        }

        // Update booking with post-rental images
        booking.postRentalImages = postRentalImages;
        booking.postRentalImagesUploadedAt = new Date();
        if (conditionNotes) {
            booking.postRentalConditionNotes = conditionNotes.trim();
        }

        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Post-rental images uploaded successfully",
            data: {
                bookingId: booking._id,
                vehicleName: booking.vehicleId.name,
                imagesCount: postRentalImages.length,
                uploadedAt: booking.postRentalImagesUploadedAt
            }
        });

    } catch (error) {
        console.error("Upload post-rental images error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload post-rental images"
        });
    }
};

