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

