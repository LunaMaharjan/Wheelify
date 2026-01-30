import mongoose from "mongoose";

const termsSchema = new mongoose.Schema({
    content: {
        type: String,
        default: "",
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
}, {
    timestamps: true,
});

const Terms = mongoose.models.Terms || mongoose.model("Terms", termsSchema);
export default Terms;
