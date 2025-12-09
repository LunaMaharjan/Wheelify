import crypto from "crypto";
import User from "../models/user.model.js";
import sendEmail from "../utils/emailTemplates.js";

const getFrontendUrl = () => {
    const url = process.env.FRONTEND_URL || "http://localhost:3000";
    return url.startsWith("http://") || url.startsWith("https://") ? url : `http://${url}`;
};

const getAdminNotificationEmail = () => {
    return process.env.ADMIN_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_MAIL;
};

export const uploadLicense = async (req, res) => {
    try {
        const userId = req.userId;
        const { licenseNumber, licenseExpiry } = req.body || {};
        const filePath = req.file?.path;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                message: "License image is required",
            });
        }

        if (!licenseNumber || !licenseNumber.trim()) {
            return res.status(400).json({
                success: false,
                message: "License number is required",
            });
        }

        if (!licenseExpiry) {
            return res.status(400).json({
                success: false,
                message: "License expiry date is required",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const parsedExpiry = new Date(licenseExpiry);
        if (isNaN(parsedExpiry.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid license expiry date",
            });
        }

        user.licenseImage = filePath;
        user.licenseNumber = licenseNumber.trim();
        user.licenseExpiry = parsedExpiry;
        user.licenseStatus = "pending";
        user.licenseUploadedAt = new Date();
        user.licenseReviewedAt = null;
        user.licenseReviewedBy = null;
        user.licenseReviewNote = "";

        const licenseVerificationToken = crypto.randomBytes(32).toString("hex");
        user.licenseVerificationToken = licenseVerificationToken;

        await user.save();

        const adminEmail = getAdminNotificationEmail();
        const reviewLink = `${getFrontendUrl()}/admin/licenses`;

        if (adminEmail) {
            try {
                await sendEmail(adminEmail, "license-uploaded-admin", {
                    userName: user.name,
                    userEmail: user.email,
                    reviewLink,
                    licenseImage: user.licenseImage,
                });
            } catch (emailError) {
                console.error("Error sending license upload admin email:", emailError);
            }
        } else {
            console.warn("Admin notification email not configured; set ADMIN_EMAIL or ADMIN_NOTIFICATION_EMAIL.");
        }

        return res.status(200).json({
            success: true,
            message: "License uploaded successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                contact: user.contact,
                address: user.address,
                licenseNumber: user.licenseNumber,
                licenseExpiry: user.licenseExpiry,
                licenseImage: user.licenseImage,
                licenseStatus: user.licenseStatus,
                licenseReviewNote: user.licenseReviewNote,
                isAccountVerified: user.isAccountVerified,
            },
        });
    } catch (error) {
        console.error("Upload license error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload license",
        });
    }
};

export const getLicenseSubmissions = async (req, res) => {
    try {
        const submissions = await User.find({
            licenseStatus: { $in: ["pending", "approved", "rejected"] },
            licenseImage: { $ne: "" },
        })
            .select(
                "name email role image licenseNumber licenseExpiry licenseImage licenseStatus licenseUploadedAt licenseReviewedAt licenseReviewNote"
            )
            .populate("licenseReviewedBy", "name email role")
            .sort({ licenseUploadedAt: -1 });

        return res.status(200).json({
            success: true,
            submissions,
        });
    } catch (error) {
        console.error("Get license submissions error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch license submissions",
        });
    }
};

export const reviewLicenseSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewNote } = req.body || {};
        const adminId = req.userId;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be 'approved' or 'rejected'",
            });
        }

        if (status === "rejected" && (!reviewNote || !reviewNote.trim())) {
            return res.status(400).json({
                success: false,
                message: "Review note is required when rejecting a license",
            });
        }

        const user = await User.findById(id);

        if (!user || !user.licenseImage) {
            return res.status(404).json({
                success: false,
                message: "License submission not found",
            });
        }

        user.licenseStatus = status;
        user.licenseReviewedBy = adminId;
        user.licenseReviewedAt = new Date();
        user.licenseReviewNote = reviewNote || "";

        await user.save();

        // Notify user about decision
        try {
            if (status === "approved") {
                await sendEmail(user.email, "license-approved-user", {
                    userName: user.name,
                });
            } else if (status === "rejected") {
                await sendEmail(user.email, "license-rejected-user", {
                    userName: user.name,
                    reviewNote: reviewNote || "",
                });
            }
        } catch (emailError) {
            console.error("Error sending license review result email:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: `License ${status}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                contact: user.contact,
                address: user.address,
                licenseNumber: user.licenseNumber,
                licenseExpiry: user.licenseExpiry,
                licenseImage: user.licenseImage,
                licenseStatus: user.licenseStatus,
                licenseReviewNote: user.licenseReviewNote,
                isAccountVerified: user.isAccountVerified,
            },
        });
    } catch (error) {
        console.error("Review license submission error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to review license submission",
        });
    }
};

