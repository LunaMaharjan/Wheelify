import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/emailTemplates.js";

const getFrontendUrl = () => {
    const url = process.env.FRONTEND_URL || "http://localhost:3000";
    return url.startsWith("http://") || url.startsWith("https://") ? url : `http://${url}`;
};

const sanitizeUser = (user) => ({
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
});

const buildCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
    };
};

const attachAuthCookie = (res, token) => {
    res.cookie("token", token, buildCookieOptions());
};

const clearAuthCookie = (res) => {
    const options = buildCookieOptions();
    res.clearCookie("token", { ...options, maxAge: 0 });
};

const createJwtToken = (userId, role) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};

// Signup controller
export const signup = async (req, res) => {
    try {
        const { name, email, password, password_confirmation, contact, address, licenseNumber, licenseExpiry } = req.body;

        // Validation
        if (!name || !email || !password || !password_confirmation || !contact || !address) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password, contact, and address are required"
            });
        }

        if (password !== password_confirmation) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        // Contact validation (basic 10 digit)
        const contactRegex = /^[0-9]{10}$/;
        if (!contactRegex.test(contact)) {
            return res.status(400).json({
                success: false,
                message: "Contact must be a 10 digit number"
            });
        }

        if (address.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Address is required"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpireAt = new Date();
        verificationTokenExpireAt.setHours(verificationTokenExpireAt.getHours() + 24); // 24 hours expiry

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            contact: contact.trim(),
            address: address.trim(),
            licenseNumber: licenseNumber?.trim?.() || "",
            licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
            verificationToken,
            verificationTokenExpireAt,
            isAccountVerified: false
        });

        // Generate verification link
        const verificationLink = `${getFrontendUrl()}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

        // Send verification email
        try {
            await sendEmail(user.email, "verify-email", {
                verificationLink
            });
        } catch (emailError) {
            console.error("Error sending verification email:", emailError);
            // Don't fail the signup if email fails, but log it
        }

        // Send email notification to all admins
        try {
            const admins = await User.find({ role: "admin" }).select("email");
            const viewUsersLink = `${getFrontendUrl()}/admin/users`;
            
            // Send email to each admin
            const emailPromises = admins.map(admin => 
                sendEmail(admin.email, "new-user-signup-admin", {
                    userName: user.name,
                    userEmail: user.email,
                    userContact: user.contact,
                    userAddress: user.address,
                    viewUsersLink: viewUsersLink
                }).catch(error => {
                    console.error(`Failed to send email to admin ${admin.email}:`, error);
                    // Don't throw - continue with other admins
                })
            );
            
            await Promise.allSettled(emailPromises);
        } catch (emailError) {
            console.error("Error sending admin notification emails:", emailError);
            // Don't fail the signup if admin email fails, but log it
        }

        res.status(201).json({
            success: true,
            message: "Account created successfully. Please check your email to verify your account.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAccountVerified: user.isAccountVerified
            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create account"
        });
    }
};

// Verify email controller
export const verifyEmail = async (req, res) => {
    try {
        const { token, email } = req.query;

        if (!token || !email) {
            return res.status(400).json({
                success: false,
                message: "Token and email are required"
            });
        }

        // Find user by email and verification token
        const user = await User.findOne({
            email: email.toLowerCase(),
            verificationToken: token
        }).select("+verificationToken +verificationTokenExpireAt");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification token or email"
            });
        }

        // Check if token is expired
        if (user.verificationTokenExpireAt && new Date() > user.verificationTokenExpireAt) {
            return res.status(400).json({
                success: false,
                message: "Verification token has expired. Please request a new one."
            });
        }

        // Check if already verified
        if (user.isAccountVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }

        // Verify the user
        user.isAccountVerified = true;
        user.verificationToken = "";
        user.verificationTokenExpireAt = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in."
        });
    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to verify email"
        });
    }
};

// Resend verification email
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() })
            .select("+verificationToken +verificationTokenExpireAt");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if already verified
        if (user.isAccountVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpireAt = new Date();
        verificationTokenExpireAt.setHours(verificationTokenExpireAt.getHours() + 24);

        // Update user
        user.verificationToken = verificationToken;
        user.verificationTokenExpireAt = verificationTokenExpireAt;
        await user.save();

        // Generate verification link
        const verificationLink = `${getFrontendUrl()}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

        // Send verification email
        try {
            await sendEmail(user.email, "verify-email", {
                verificationLink
            });
        } catch (emailError) {
            console.error("Error sending verification email:", emailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send verification email"
            });
        }

        res.status(200).json({
            success: true,
            message: "Verification email sent successfully"
        });
    } catch (error) {
        console.error("Resend verification error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to resend verification email"
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.isAccountVerified) {
            return res.status(403).json({
                success: false,
                verification_required: true,
                message: "Please verify your email before logging in",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = createJwtToken(user._id, user.role);
        attachAuthCookie(res, token);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to login",
        });
    }
};

export const logout = (req, res) => {
    try {
        clearAuthCookie(res);
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to logout",
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const currentUser = req.user.toObject ? req.user.toObject() : req.user;

        res.status(200).json({
            success: true,
            user: sanitizeUser(currentUser),
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch profile",
        });
    }
};

