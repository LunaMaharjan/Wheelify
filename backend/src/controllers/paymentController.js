import crypto from "crypto";
import Booking from "../models/booking.model.js";
import Vehicle from "../models/vehicle.model.js";
import User from "../models/user.model.js";
import sendEmail from "../utils/emailTemplates.js";

// eSewa API configuration
const ESEWA_BASE_URL = process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_STATUS_URL = process.env.ESEWA_STATUS_URL || "https://rc.esewa.com.np/api/epay/transaction/status/";
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";    
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";

// Validate eSewa configuration
if (!ESEWA_SECRET_KEY) {
    console.error("⚠️  WARNING: ESEWA_SECRET_KEY is not set in environment variables!");
    console.error("   Please add ESEWA_SECRET_KEY to your .env file");
}

// Temporary storage for booking data
const pendingBookingData = new Map();

/**
 * Generate HMAC SHA256 signature for eSewa
 * According to eSewa docs: HMAC SHA256 with base64 output
 */
const generateEsewaSignature = (data, secretKey) => {
    try {
        // Ensure data is a string
        const dataString = String(data);
        // Ensure secretKey is a string
        const secretKeyString = String(secretKey);
        
        // Create HMAC with SHA256
        const hmac = crypto.createHmac("sha256", secretKeyString);
        hmac.update(dataString, "utf8");
        
        // Return base64 encoded digest
        return hmac.digest("base64");
    } catch (error) {
        console.error("Error generating eSewa signature:", error);
        throw error;
    }
};

function createEsewaSignature({ total_amount, transaction_uuid, product_code }) {
    const secret = ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
    
    const totalAmountStr = String(total_amount).trim();
    const transactionUuidStr = String(transaction_uuid).trim();
    const productCodeStr = String(product_code).trim();
    
    // Signature must use exact total_amount value as sent in form
    // Format: field_name=value,field_name=value,field_name=value
    // According to eSewa docs, the order and format must match exactly
    const message = `total_amount=${totalAmountStr},transaction_uuid=${transactionUuidStr},product_code=${productCodeStr}`;
    
    // Create HMAC SHA256 signature (same as CryptoJS.HmacSHA256)
    // Node.js crypto.createHmac is equivalent to CryptoJS.HmacSHA256
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message, 'utf8');
    const signature = hmac.digest('base64');
    
    return signature;
}

/**
 * Helper function to create booking from payment data
 */
const createBookingFromPaymentData = async (bookingData, userId) => {
    const { vehicleId, startDate, endDate, totalDays, pricePerDay, totalAmount, notes, paymentMethod } = bookingData;

    // Get vehicle details
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
        throw new Error("Vehicle not found");
    }

    // Get user to extract pickup location from their address
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    // Create pickup location - prioritize vehicle pickupLocation, then fallback to parsing location string
    let pickupLocation;
    
    if (vehicle.pickupLocation && vehicle.pickupLocation.address && vehicle.pickupLocation.city) {
        pickupLocation = vehicle.pickupLocation;
    } else if (vehicle.location && vehicle.location.includes(",")) {
        const parts = vehicle.location.split(",");
        pickupLocation = {
            address: parts[0].trim(),
            city: parts[1].trim()
        };
    } else {
        // Fallback to user's address
        pickupLocation = {
            address: vehicle.location || user.address || "Pickup Location",
            city: "City"
        };
    }

    // Create booking
    const booking = await Booking.create({
        userId,
        vehicleId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays,
        pricePerDay,
        totalAmount,
        paymentMethod,
        paymentStatus: "paid",
        bookingStatus: "confirmed",
        pickupLocation: pickupLocation,
        notes: notes || "",
        isPaymentDeferred: false
    });

    // Mark vehicle as unavailable
    // await Vehicle.findByIdAndUpdate(vehicleId, { isAvailable: false });

    return booking;
};


/**
 * Initiate eSewa payment - booking will be created only after payment succeeds
 */
export const initiateEsewaPayment = async (req, res) => {
    try {
        // Validate eSewa configuration
        if (!ESEWA_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                message: "Payment service is not configured. Please contact support."
            });
        }

        const { bookingData } = req.body;
        const userId = req.userId;

        if (!bookingData) {
            return res.status(400).json({
                success: false,
                message: "Booking data is required"
            });
        }

        const { vehicleId, startDate, endDate, totalDays, pricePerDay, totalAmount } = bookingData;

        // Validate required fields
        if (!vehicleId || !startDate || !endDate || !totalDays || !pricePerDay || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: "All booking fields are required"
            });
        }

        // Get vehicle details
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        // Check if vehicle is available
        if (vehicle.status !== "available") {
            return res.status(400).json({
                success: false,
                message: "Vehicle is not available for booking"
            });
        }

        // Check for overlapping bookings
        const start = new Date(startDate);
        const end = new Date(endDate);
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

        // Validate amount (minimum 1 rupee)
        if (totalAmount < 1) {
            return res.status(400).json({
                success: false,
                message: "Amount must be at least Rs. 1"
            });
        }

        // Generate unique transaction UUID (will be used to retrieve booking data in callback)
        const transactionUuid = `esewa_${Date.now()}_${userId}_${vehicleId}`;

        // Prepare payment parameters
        // According to eSewa docs, signature format: field_name=value,field_name=value
        // Example: total_amount=100,transaction_uuid=11-201-13,product_code=EPAYTEST
        const signedFieldNames = "total_amount,transaction_uuid,product_code";
        
        // Store booking data temporarily (will be retrieved in callback)
        pendingBookingData.set(transactionUuid, {
            userId,
            vehicleId,
            startDate,
            endDate,
            totalDays,
            pricePerDay,
            totalAmount,
            paymentMethod: "esewa"
        });
        
        // Format values - ensure they match exactly what's sent in the form
        // total_amount should always have 2 decimal places for eSewa
        const totalAmountFormatted = totalAmount.toFixed(2);
        
        // Generate signature using createEsewaSignature function
        // IMPORTANT: Use the exact formatted total_amount value that will be sent in the form
        const signature = createEsewaSignature({
            total_amount: totalAmountFormatted,
            transaction_uuid: transactionUuid,
            product_code: ESEWA_PRODUCT_CODE
        });
        
        // Debug logging (remove in production)
        console.log("=== eSewa Payment Initiation ===");
        console.log("Amount:", totalAmount);
        console.log("Total Amount (formatted):", totalAmountFormatted);
        console.log("Transaction UUID:", transactionUuid);
        console.log("Product Code:", ESEWA_PRODUCT_CODE);
        console.log("Secret Key:", ESEWA_SECRET_KEY ? "Set" : "Not Set");
        console.log("Secret Key Length:", ESEWA_SECRET_KEY ? ESEWA_SECRET_KEY.length : 0);
        console.log("Signed Field Names:", signedFieldNames);
        console.log("Signature Message:", `total_amount=${totalAmountFormatted},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`);
        console.log("Generated Signature:", signature);
        console.log("Signature Length:", signature.length);
        console.log("================================");

        // Use SERVER_URL if available, otherwise construct from request
        // For eSewa callback, we need a publicly accessible URL with proper protocol
        let serverUrl = process.env.SERVER_URL || process.env.BACKEND_URL;
        
        // If SERVER_URL is not set, try to construct it
        if (!serverUrl) {   
            // Always use backend server URL, not frontend
            // In development, use localhost with backend port
            const backendPort = process.env.PORT || 5001;
            serverUrl = `http://localhost:${backendPort}`;
            
            // In production, you should set SERVER_URL or BACKEND_URL environment variable
            // For now, fallback to localhost (this should be configured properly in production)
            if (process.env.NODE_ENV === 'production') {
                console.warn("⚠️  WARNING: SERVER_URL or BACKEND_URL not set in production!");
                console.warn("   Please set SERVER_URL or BACKEND_URL environment variable.");
            }
        }
        
        // Ensure URL has protocol (http:// or https://)
        if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
            // If no protocol, assume http for localhost, https otherwise
            if (serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1')) {
                serverUrl = `http://${serverUrl}`;
            } else {
                serverUrl = `https://${serverUrl}`;
            }
        }
        
        // Remove trailing slash if present
        serverUrl = serverUrl.replace(/\/$/, '');
        
        const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
        
        // eSewa callback URL - must be publicly accessible with proper format
        const successUrl = `${serverUrl}/api/payments/esewa/callback`;
        const failureUrl = `${serverUrl}/api/payments/esewa/callback`;
        
        console.log("Callback URLs:", { successUrl, failureUrl });

        // Return payment form data for frontend to submit
        // Note: Booking will be created only after payment succeeds in the callback
        res.json({
            success: true,
            message: "Payment initiated successfully",
            data: {
                transactionUuid,
                formData: {
                    amount: totalAmount.toFixed(2),
                    tax_amount: "0",
                    total_amount: totalAmountFormatted,
                    transaction_uuid: transactionUuid,
                    product_code: ESEWA_PRODUCT_CODE,
                    product_service_charge: "0",
                    product_delivery_charge: "0",
                    success_url: successUrl,
                    failure_url: failureUrl,
                    signed_field_names: signedFieldNames,
                    signature: signature
                },
                formUrl: ESEWA_BASE_URL,
                transactionUuid: transactionUuid
            }
        });
    } catch (error) {
        console.error("Error initiating eSewa payment:", error);
        
        res.status(500).json({
            success: false,
            message: error.message || "Failed to initiate payment"
        });
    }
};

/**
 * Handle eSewa payment callback (success/failure)
 */
export const esewaPaymentCallback = async (req, res) => {
    try {
        // Log all incoming data for debugging
        console.log("=== eSewa Callback Received ===");
        console.log("Method:", req.method);
        console.log("Query params:", JSON.stringify(req.query, null, 2));
        console.log("Body:", JSON.stringify(req.body, null, 2));
        console.log("Headers:", JSON.stringify(req.headers, null, 2));
        console.log("================================");

        // eSewa can send data via GET (query params) or POST (form data)
        // Try to get data from both sources
        const queryData = req.query || {};
        const bodyData = req.body || {};
        
        // Merge both sources (body takes precedence for POST)
        const callbackData = {
            ...queryData,
            ...bodyData
        };

        // Decode base64-encoded payload if eSewa sent everything in a single `data` field
        // Some gateways send `data` as base64 JSON instead of individual params
        if (callbackData.data) {
            try {
                const decodedJson = Buffer.from(callbackData.data, "base64").toString("utf-8");
                let decodedObject = null;

                try {
                    decodedObject = JSON.parse(decodedJson);
                } catch {
                    // Some providers send URL-encoded query strings instead of JSON
                    const params = new URLSearchParams(decodedJson);
                    decodedObject = Object.fromEntries(params.entries());
                }

                if (decodedObject) {
                    Object.assign(callbackData, decodedObject);
                    console.log("Decoded base64 callback data:", decodedObject);
                    delete callbackData.data; // avoid double-handling later
                }
            } catch (decodeErr) {
                console.error("Failed to decode base64 callback data:", decodeErr);
            }
        }

        // Extract data - handle both standard and alternative field names
        const transaction_code = callbackData.transaction_code || callbackData.ref_id || callbackData.transactionCode;
        const status = callbackData.status || callbackData.Status;
        const total_amount = callbackData.total_amount || callbackData.totalAmount;
        // transaction_uuid is critical - try multiple variations
        const transaction_uuid = callbackData.transaction_uuid || 
                                 callbackData.transactionUuid ||
                                 callbackData.uuid ||
                                 callbackData.transactionUUID;
        const product_code = callbackData.product_code || callbackData.productCode;
        const signed_field_names = callbackData.signed_field_names || callbackData.signedFieldNames;
        const signature = callbackData.signature;

        console.log("Extracted callback data:", {
            transaction_code,
            status,
            total_amount,
            transaction_uuid,
            product_code,
            signed_field_names: signed_field_names ? signed_field_names.substring(0, 50) + "..." : null,
            signature: signature ? signature.substring(0, 20) + "..." : null
        });

        // Try to find transaction_uuid - use fallback if not in callback
        let actualTransactionUuid = transaction_uuid;
        
        if (!actualTransactionUuid) {
            console.error("Missing transaction_uuid in callback data");
            console.error("Available keys in callbackData:", Object.keys(callbackData));
            console.error("Full callbackData:", JSON.stringify(callbackData, null, 2));
            
            // Try to find transaction_uuid in pending bookings by matching other fields
            // This is a fallback if eSewa doesn't send transaction_uuid
            let foundUuid = null;
            if (total_amount && product_code) {
                for (const [uuid, bookingData] of pendingBookingData.entries()) {
                    const expectedTotal = bookingData.totalAmount;
                    if (Math.abs(parseFloat(total_amount) - expectedTotal) < 0.01) {
                        foundUuid = uuid;
                        console.log("Found matching transaction_uuid by amount:", foundUuid);
                        break;
                    }
                }
            }
            
            if (!foundUuid) {
                return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?error=missing_transaction_uuid`);
            }
            
            actualTransactionUuid = foundUuid;
            console.log("Using found transaction_uuid:", actualTransactionUuid);
        }

        // Retrieve booking data from temporary storage
        const bookingData = pendingBookingData.get(actualTransactionUuid);

        if (!bookingData) {
            return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?error=booking_data_not_found`);
        }

        // Verify signature if provided
        // eSewa callback signature format: field_name=value,field_name=value,...
        let signatureValid = true;
        if (signature && signed_field_names) {
            const signatureData = signed_field_names.split(",")
                .map(field => {
                    const fieldName = field.trim();
                    let fieldValue = "";
                    switch (fieldName) {
                        case "transaction_code": fieldValue = transaction_code || ""; break;
                        case "status": fieldValue = status || ""; break;
                        case "total_amount": fieldValue = total_amount || ""; break;
                        case "transaction_uuid": fieldValue = actualTransactionUuid || ""; break;
                        case "product_code": fieldValue = product_code || ""; break;
                        case "signed_field_names": fieldValue = signed_field_names || ""; break;
                        default: fieldValue = "";
                    }
                    return `${fieldName}=${fieldValue}`;
                })
                .join(",");

            const expectedSignature = generateEsewaSignature(signatureData, ESEWA_SECRET_KEY);
            signatureValid = signature === expectedSignature;
            
            if (!signatureValid) {
                console.error("Signature verification failed");
                console.error("Expected:", expectedSignature);
                console.error("Received:", signature);
                console.error("Signature data:", signatureData);
            }
        }

        // Handle different statuses
        if (status === "COMPLETE" && signatureValid) {
            try {
                // Verify amount matches (allow small floating point differences)
                if (Math.abs(parseFloat(total_amount) - bookingData.totalAmount) < 0.01) {
                    // Create booking only after successful payment
                    const booking = await createBookingFromPaymentData(bookingData, bookingData.userId);
                    
                    // Update booking with eSewa transaction details
                    booking.esewaTransactionUuid = actualTransactionUuid;
                    booking.esewaTransactionCode = transaction_code || null;
                    booking.esewaRefId = transaction_code || null;
                    await booking.save();
                    
                    // Send confirmation emails to both user and vendor
                    try {
                        // Populate booking to get user and vehicle details
                        await booking.populate('userId vehicleId');
                        
                        // Get vendor details
                        const vendor = await User.findById(booking.vehicleId.vendorId);
                        
                        // Format dates for email
                        const formatDate = (date) => {
                            return new Date(date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            });
                        };
                        
                        // Format pickup location
                        const pickupLocationStr = booking.pickupLocation 
                            ? `${booking.pickupLocation.street}, ${booking.pickupLocation.city}, ${booking.pickupLocation.state}`
                            : 'N/A';
                        
                        // Send email to user
                        await sendEmail(booking.userId.email, 'booking-confirmation-user', {
                            userName: booking.userId.name,
                            vehicleName: booking.vehicleId.name,
                            startDate: formatDate(booking.startDate),
                            endDate: formatDate(booking.endDate),
                            totalAmount: booking.totalAmount,
                            totalDays: booking.totalDays,
                            pickupLocation: pickupLocationStr,
                            bookingId: booking._id.toString(),
                            pricePerDay: booking.pricePerDay,
                            vendorContact: vendor?.contact || 'N/A'
                        });
                        
                        // Send email to vendor
                        if (vendor && vendor.email) {
                            await sendEmail(vendor.email, 'booking-confirmation-vendor', {
                                vendorName: vendor.name,
                                vehicleName: booking.vehicleId.name,
                                userName: booking.userId.name,
                                userContact: booking.userId.contact || 'N/A',
                                startDate: formatDate(booking.startDate),
                                endDate: formatDate(booking.endDate),
                                totalAmount: booking.totalAmount,
                                totalDays: booking.totalDays,
                                pickupLocation: pickupLocationStr,
                                bookingId: booking._id.toString(),
                                pricePerDay: booking.pricePerDay
                            });
                        }
                        
                        console.log('✅ Booking confirmation emails sent successfully');
                    } catch (emailError) {
                        // Log error but don't fail the booking
                        console.error('❌ Error sending booking confirmation emails:', emailError);
                        // Booking is still successful even if email fails
                    }
                    
                    // Remove from temporary storage
                    pendingBookingData.delete(actualTransactionUuid);
                    
                    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/success?bookingId=${booking._id}`);
                } else {
                    // Amount mismatch - potential fraud
                    console.error("Amount mismatch. Expected:", bookingData.totalAmount, "Received:", total_amount);
                    // Remove from temporary storage
                    pendingBookingData.delete(actualTransactionUuid);
                    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?error=amount_mismatch`);
                }
            } catch (createError) {
                console.error("Error creating booking after payment:", createError);
                // Remove from temporary storage
                pendingBookingData.delete(actualTransactionUuid);
                return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?error=booking_creation_failed`);
            }
        } else if (status === "CANCELED" || status === "FAILURE") {
            // Payment cancelled/failed - no booking created, remove from temp storage
            pendingBookingData.delete(actualTransactionUuid);
            return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/cancelled`);
        } else {
            // Pending or other statuses - keep in temp storage for status check
            return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/pending?status=${status || "PENDING"}&transactionUuid=${actualTransactionUuid}`);
        }
    } catch (error) {
        console.error("Error handling eSewa payment callback:", error);
        return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?error=callback_error`);
    }
};

/**
 * Check eSewa payment status
 */
export const checkEsewaPaymentStatus = async (req, res) => {
    try {
        const { transactionUuid, bookingId } = req.body;

        if (!transactionUuid && !bookingId) {
            return res.status(400).json({
                success: false,
                message: "Transaction UUID or Booking ID is required"
            });
        }

        let booking = null;
        let bookingData = null;
        let uuid = null;
        let totalAmount = null;

        // Try to find existing booking first
        if (bookingId) {
            booking = await Booking.findById(bookingId);
            if (booking && booking.esewaTransactionUuid) {
                uuid = booking.esewaTransactionUuid;
                totalAmount = booking.totalAmount;
            }
        } else {
            // Try to find booking by transaction UUID
            booking = await Booking.findOne({ esewaTransactionUuid: transactionUuid });
            if (booking) {
                uuid = booking.esewaTransactionUuid;
                totalAmount = booking.totalAmount;
            } else {
                // Booking doesn't exist yet, check temporary storage
                bookingData = pendingBookingData.get(transactionUuid);
                if (bookingData) {
                    uuid = transactionUuid;
                    totalAmount = bookingData.totalAmount;
                }
            }
        }

        if (!uuid) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        // Check status from eSewa API
        try {
            const statusResponse = await fetch(ESEWA_STATUS_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    product_code: ESEWA_PRODUCT_CODE,
                    total_amount: totalAmount,
                    transaction_uuid: uuid
                }
            })
            const statusData = statusResponse.data;

            // If booking doesn't exist yet and payment is complete, create it
            if (!booking && statusData.status === "COMPLETE" && bookingData) {
                try {
                    booking = await createBookingFromPaymentData(bookingData, bookingData.userId);
                    booking.esewaTransactionUuid = uuid;
                    booking.esewaRefId = statusData.ref_id || null;
                    await booking.save();
                    
                    // Remove from temporary storage
                    pendingBookingData.delete(uuid);
                } catch (createError) {
                    console.error("Error creating booking from status check:", createError);
                    return res.status(500).json({
                        success: false,
                        message: "Payment completed but failed to create booking"
                    });
                }
            }

            // Update booking based on status (only if booking exists)
            if (booking) {
                if (statusData.status === "COMPLETE" && booking.paymentStatus !== "paid") {
                    booking.paymentStatus = "paid";
                    booking.bookingStatus = "confirmed";
                    booking.esewaRefId = statusData.ref_id || null;
                    booking.isPaymentDeferred = false;
                    
                    // Mark vehicle as unavailable
                    // await Vehicle.findByIdAndUpdate(booking.vehicleId, { isAvailable: false });
                    await booking.save();
                } else if (statusData.status === "FULL_REFUND" || statusData.status === "PARTIAL_REFUND") {
                    booking.paymentStatus = "refunded";
                    await booking.save();
                } else if (statusData.status === "CANCELED") {
                    booking.bookingStatus = "cancelled";
                    await booking.save();
                } else if (statusData.status === "NOT_FOUND") {
                    // Transaction expired or not found
                    if (bookingData) {
                        // Remove from temp storage if still pending
                        pendingBookingData.delete(uuid);
                    } else {
                        booking.bookingStatus = "cancelled";
                        await booking.save();
                    }
                }
            } else if (statusData.status === "CANCELED" || statusData.status === "NOT_FOUND") {
                // Payment cancelled/not found and no booking exists - clean up temp storage
                if (bookingData) {
                    pendingBookingData.delete(uuid);
                }
            }

            res.json({
                success: true,
                message: "Payment status checked",
                data: {
                    status: statusData.status,
                    refId: statusData.ref_id,
                    booking: booking ? {
                        id: booking._id,
                        paymentStatus: booking.paymentStatus,
                        bookingStatus: booking.bookingStatus
                    } : null
                }
            });
        } catch (apiError) {
            console.error("Error checking eSewa status:", apiError);
            
            if (apiError.response) {
                return res.status(apiError.response.status || 500).json({
                    success: false,
                    message: apiError.response.data?.error_message || "Failed to check payment status",
                    error: apiError.response.data
                });
            }

            res.status(500).json({
                success: false,
                message: "Failed to check payment status"
            });
        }
    } catch (error) {
        console.error("Error checking payment status:", error);
        
        res.status(500).json({
            success: false,
            message: error.message || "Failed to check payment status"
        });
    }
};

/**
 * Verify eSewa payment (for manual verification)
 */
export const verifyEsewaPayment = async (req, res) => {
    try {
        const { transactionUuid, bookingId } = req.body;

        if (!transactionUuid && !bookingId) {
            return res.status(400).json({
                success: false,
                message: "Transaction UUID or Booking ID is required"
            });
        }

        // This is essentially the same as status check, but with verification logic
        return await checkEsewaPaymentStatus(req, res);
    } catch (error) {
        console.error("Error verifying eSewa payment:", error);
        
        res.status(500).json({
            success: false,
            message: error.message || "Failed to verify payment"
        });
    }
};

