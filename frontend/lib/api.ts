import axiosInstance from "./axiosInstance";

// Signup API
export const signup = async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}) => {
    const response = await axiosInstance.post("/register", data);
    return response.data;
};

// Verify email API
export const verifyEmail = async (token: string, email: string) => {
    const response = await axiosInstance.get("/verify-email", {
        params: { token, email }
    });
    return response.data;
};

// Resend verification email API
export const resendVerification = async (email: string) => {
    const response = await axiosInstance.post("/resend-verification", { email });
    return response.data;
};

// Login API
export const login = async (data: { email: string; password: string }) => {
    const response = await axiosInstance.post("/login", data);
    return response.data;
};

// Logout API
export const logout = async () => {
    const response = await axiosInstance.post("/logout");
    return response.data;
};

// Profile API
export const getProfile = async () => {
    const response = await axiosInstance.get("/profile");
    return response.data;
};

// Admin API - Dashboard Stats
export const getDashboardStats = async () => {
    const response = await axiosInstance.get("/admin/stats");
    return response.data;
};

// Admin API - Users
export const getAllUsers = async () => {
    const response = await axiosInstance.get("/admin/users");
    return response.data;
};

export const deleteUser = async (userId: string) => {
    const response = await axiosInstance.delete(`/admin/users/${userId}`);
    return response.data;
};

export const toggleUserVerification = async (userId: string, isAccountVerified: boolean) => {
    const response = await axiosInstance.patch(`/admin/users/${userId}/verification`, {
        isAccountVerified,
    });
    return response.data;
};

// Admin API - Vendors
export const getAllVendors = async () => {
    const response = await axiosInstance.get("/admin/vendors");
    return response.data;
};

export const approveVendor = async (vendorId: string) => {
    const response = await axiosInstance.patch(`/admin/vendors/${vendorId}/approve`);
    return response.data;
};

export const rejectVendor = async (vendorId: string) => {
    const response = await axiosInstance.patch(`/admin/vendors/${vendorId}/reject`);
    return response.data;
};

export const toggleVendorVerification = async (vendorId: string, isAccountVerified: boolean) => {
    const response = await axiosInstance.patch(`/admin/vendors/${vendorId}/verification`, {
        isAccountVerified,
    });
    return response.data;
};

