import crypto from "crypto";
import Booking from "../models/booking.model.js";
import Vehicle from "../models/vehicle.model.js";
import User from "../models/user.model.js";
import sendEmail from "../utils/emailTemplates.js";

// eSewa API configuration
const ESEWA_BASE_URL = process.env.ESEWA_BASE_URL
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE   
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY;
const frontendUrl = process.env.FRONTEND_URL;

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
        let serverUrl = process.env.BACKEND_URL;
                
        const successUrl = `${serverUrl}/api/payments/esewa/callback`;
        const failureUrl = `${serverUrl}/api/payments/esewa/callback`;
        
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

        let callbackData = req.query || {};
        
        const decodedJson = Buffer.from(callbackData.data, "base64").toString("utf-8");
        callbackData = JSON.parse(decodedJson);

        // Extract data - handle both standard and alternative field names
        const transaction_code = callbackData.transaction_code;
        const status = callbackData.status;
        const total_amount = callbackData.total_amount;
        // transaction_uuid is critical - try multiple variations
        const transaction_uuid = callbackData.transaction_uuid;
        const product_code = callbackData.product_code;
        const signed_field_names = callbackData.signed_field_names;
        const signature = callbackData.signature;        

        // Retrieve booking data from temporary storage
        const bookingData = pendingBookingData.get(transaction_uuid);

        if (!bookingData) {
            return res.redirect(`${frontendUrl}/payment/failed?error=booking_data_not_found`);
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
                        case "transaction_uuid": fieldValue = transaction_uuid || ""; break;
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
                    booking.esewaTransactionUuid = transaction_uuid;
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
                        console.log("Sending email to user:", booking);
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
                    pendingBookingData.delete(transaction_uuid);
                    
                    return res.redirect(`${frontendUrl}/payment/success?bookingId=${booking._id}`);
                } else {
                    // Amount mismatch - potential fraud
                    console.error("Amount mismatch. Expected:", bookingData.totalAmount, "Received:", total_amount);
                    // Remove from temporary storage
                    pendingBookingData.delete(transaction_uuid);
                    return res.redirect(`${frontendUrl}/payment/failed?error=amount_mismatch`);
                }
            } catch (createError) {
                console.error("Error creating booking after payment:", createError);
                // Remove from temporary storage
                pendingBookingData.delete(transaction_uuid);
                return res.redirect(`${frontendUrl}/payment/failed?error=booking_creation_failed`);
            }
        } else if (status === "CANCELED" || status === "FAILURE") {
            // Payment cancelled/failed - no booking created, remove from temp storage
            pendingBookingData.delete(transaction_uuid);
            return res.redirect(`${frontendUrl}/payment/cancelled`);
        } else {
            // Pending or other statuses - keep in temp storage for status check
            return res.redirect(`${frontendUrl}/payment/pending?status=${status || "PENDING"}&transactionUuid=${transaction_uuid}`);
        }
    } catch (error) {
        console.error("Error handling eSewa payment callback:", error);
        return res.redirect(`${frontendUrl}/payment/failed?error=callback_error`);
    }
};
