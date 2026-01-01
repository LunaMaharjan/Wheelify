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

