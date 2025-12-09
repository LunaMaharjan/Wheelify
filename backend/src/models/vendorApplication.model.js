import mongoose from "mongoose";

const vendorApplicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
        unique: true
    },
    citizenshipFront: {
        type: String,
        required: [true, "Citizenship front image is required"]
    },
    citizenshipBack: {
        type: String,
        required: [true, "Citizenship back image is required"]
    },
    otherDocuments: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    rejectionMessage: {
        type: String,
        default: ""
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
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

const VendorApplication = mongoose.models.VendorApplication || mongoose.model("VendorApplication", vendorApplicationSchema);
export default VendorApplication;

