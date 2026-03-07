import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        totalDays: {
            type: Number,
            required: true
        },
        pricePerDay: {
            type: Number,
            required: true
        },
        totalAmount: {
            type: Number,
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "refunded"],
            default: "pending"
        },
        paymentMethod: {
            type: String,
            enum: ["esewa"],
            default: "esewa"
        },
        // eSewa payment fields
        esewaTransactionUuid: {
            type: String,
            default: null
        },
        esewaTransactionCode: {
            type: String,
            default: null
        },
        esewaRefId: {
            type: String,
            default: null
        },
        bookingStatus: {
            type: String,
            enum: ["pending", "confirmed", "active", "completed", "cancelled"],
            default: "pending"
        },
        pickupLocation: {
            address: { type: String, required: true },
            city: { type: String, required: true }
        },
        isPaymentDeferred: {
            type: Boolean,
            default: false
        },
        // Pre-rental vehicle condition images uploaded by vendor
        preRentalImages: {
            type: [String], // Array of image URLs
            default: []
        },
        preRentalImagesUploadedAt: {
            type: Date,
            default: null
        },
        preRentalConditionNotes: {
            type: String,
            default: ""
        },
        // Post-rental vehicle condition images from vendor
        vendorPostRentalImages: {
            type: [String], // Array of image URLs
            default: []
        },
        vendorPostRentalImagesUploadedAt: {
            type: Date,
            default: null
        },
        vendorPostRentalConditionNotes: {
            type: String,
            default: ""
        },
        // Post-rental vehicle condition images from user
        userPostRentalImages: {
            type: [String], // Array of image URLs
            default: []
        },
        userPostRentalImagesUploadedAt: {
            type: Date,
            default: null
        },
        userPostRentalConditionNotes: {
            type: String,
            default: ""
        },
        // AI-powered condition comparison (Gemini) between pre- and post-rental photos
        conditionComparisonSummary: {
            type: String,
            default: ""
        },
        conditionComparisonJson: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        conditionComparisonModel: {
            type: String,
            default: ""
        },
        conditionComparisonUpdatedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Validate that endDate is after startDate
bookingSchema.pre("save", function () {
    if (this.endDate <= this.startDate) {
        throw new Error("End date must be after start date");
    }
});

export default mongoose.model("Booking", bookingSchema);

