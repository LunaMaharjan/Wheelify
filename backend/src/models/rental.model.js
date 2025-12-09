import mongoose from "mongoose";

const rentalSchema = new mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: [true, "Vehicle ID is required"]
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Vendor ID is required"]
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Customer ID is required"]
    },
    startDate: {
        type: Date,
        required: [true, "Start date is required"]
    },
    endDate: {
        type: Date,
        required: [true, "End date is required"]
    },
    totalPrice: {
        type: Number,
        required: [true, "Total price is required"],
        min: [0, "Price must be positive"]
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "active", "completed", "cancelled"],
        default: "pending"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending"
    },
    notes: {
        type: String,
        default: ""
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            return ret;
        }
    },
    toObject: {
        virtuals: true
    }
});

const Rental = mongoose.models.Rental || mongoose.model("Rental", rentalSchema);
export default Rental;

