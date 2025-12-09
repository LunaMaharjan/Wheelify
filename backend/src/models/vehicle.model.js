import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Vendor ID is required"]
    },
    name: {
        type: String,
        required: [true, "Vehicle name is required"],
        trim: true
    },
    type: {
        type: String,
        required: [true, "Vehicle type is required"],
        enum: ["car", "bike", "scooter", "other"]
    },
    description: {
        type: String,
        default: ""
    },
    images: {
        type: [String],
        default: []
    },
    pricePerDay: {
        type: Number,
        required: [true, "Price per day is required"],
        min: [0, "Price must be positive"]
    },
    status: {
        type: String,
        enum: ["available", "rented", "maintenance", "inactive"],
        default: "available"
    },
    location: {
        type: String,
        default: ""
    },
    specifications: {
        type: Map,
        of: String,
        default: {}
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

const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;

