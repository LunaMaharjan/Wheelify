import axiosInstance from "./axiosInstance";

// Signup API
export const signup = async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    contact: string;
    address: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    licenseFile?: File;
}) => {
    // If license file is present, send as FormData, otherwise send as JSON
    if (data.licenseFile) {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("password_confirmation", data.password_confirmation);
        formData.append("contact", data.contact);
        formData.append("address", data.address);
        if (data.licenseNumber) {
            formData.append("licenseNumber", data.licenseNumber);
        }
        if (data.licenseExpiry) {
            formData.append("licenseExpiry", data.licenseExpiry);
        }
        formData.append("licenseImage", data.licenseFile);
        
        const response = await axiosInstance.post("/register", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } else {
        const response = await axiosInstance.post("/register", data);
        return response.data;
    }
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

// License API
export const uploadLicense = async (formData: FormData) => {
    const response = await axiosInstance.post("/license/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
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

export const approveVendor = async (vendorId: string, message?: string) => {
    const response = await axiosInstance.patch(`/admin/vendors/${vendorId}/approve`, {
        message
    });
    return response.data;
};

export const rejectVendor = async (vendorId: string, message: string) => {
    const response = await axiosInstance.patch(`/admin/vendors/${vendorId}/reject`, {
        message
    });
    return response.data;
};

export const getVendorApplications = async () => {
    const response = await axiosInstance.get("/admin/vendors/applications");
    return response.data;
};

export const getVendorApplicationDetails = async (applicationId: string) => {
    const response = await axiosInstance.get(`/admin/vendors/applications/${applicationId}`);
    return response.data;
};

export const toggleVendorVerification = async (vendorId: string, isAccountVerified: boolean) => {
    const response = await axiosInstance.patch(`/admin/vendors/${vendorId}/verification`, {
        isAccountVerified,
    });
    return response.data;
};

// Admin API - Licenses
export const getLicenseSubmissions = async () => {
    const response = await axiosInstance.get("/admin/licenses");
    return response.data;
};

export const reviewLicenseSubmission = async (
    userId: string,
    status: "approved" | "rejected",
    reviewNote?: string
) => {
    const response = await axiosInstance.patch(`/admin/licenses/${userId}/review`, {
        status,
        reviewNote,
    });
    return response.data;
};

// Vendor API - Application
export const submitVendorApplication = async (formData: FormData) => {
    const response = await axiosInstance.post("/vendor/apply", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const getMyVendorApplication = async () => {
    const response = await axiosInstance.get("/vendor/application");
    return response.data;
};

// Vendor API - Dashboard
export const getMyVehicles = async () => {
    const response = await axiosInstance.get("/vendor/vehicles");
    return response.data;
};

export const getMyRentals = async () => {
    const response = await axiosInstance.get("/vendor/rentals");
    return response.data;
};

export const getMyRevenue = async () => {
    const response = await axiosInstance.get("/vendor/revenue");
    return response.data;
};

// Vendor API - Vehicle Upload
export const uploadVehicle = async (formData: FormData) => {
    const response = await axiosInstance.post("/vendor/vehicles", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

// Vendor API - Update Vehicle (for rejected vehicles)
export const updateVehicle = async (vehicleId: string, formData: FormData) => {
    const response = await axiosInstance.put(`/vendor/vehicles/${vehicleId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

// Admin API - Vehicles
export const getAllVehicles = async (approvalStatus?: string) => {
    const params = approvalStatus ? { approvalStatus } : {};
    const response = await axiosInstance.get("/admin/vehicles", { params });
    return response.data;
};

export const approveVehicle = async (vehicleId: string) => {
    const response = await axiosInstance.patch(`/admin/vehicles/${vehicleId}/approve`);
    return response.data;
};

export const rejectVehicle = async (vehicleId: string, message: string) => {
    const response = await axiosInstance.patch(`/admin/vehicles/${vehicleId}/reject`, {
        message
    });
    return response.data;
};

// Admin API - Bookings
export const getAllBookings = async () => {
    const response = await axiosInstance.get("/admin/bookings");
    return response.data;
};

// Public Search API - Vehicles
export interface SearchVehiclesParams {
    query?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    condition?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export const searchVehicles = async (params: SearchVehiclesParams = {}) => {
    const response = await axiosInstance.get("/vehicles/search", { params });
    return response.data;
};

// Get single vehicle by ID (public)
export const getVehicleById = async (vehicleId: string) => {
    const response = await axiosInstance.get(`/vehicles/${vehicleId}`);
    return response.data;
};

// Booking API
export interface CheckAvailabilityParams {
    vehicleId: string;
    startDate: string;
    endDate: string;
}

export interface BookingData {
    vehicleId: string;
    startDate: string;
    endDate: string;
    isPaymentDeferred?: boolean;
}

export interface PaymentInitiationData {
    bookingData: {
        vehicleId: string;
        startDate: string;
        endDate: string;
        totalDays: number;
        pricePerDay: number;
        totalAmount: number;
    };
}

export const checkAvailability = async (params: CheckAvailabilityParams) => {
    const response = await axiosInstance.get("/bookings/check-availability", { params });
    return response.data;
};

export const createBooking = async (data: BookingData) => {
    const response = await axiosInstance.post("/bookings/create", data);
    return response.data;
};

export const getUserBookings = async () => {
    const response = await axiosInstance.get("/bookings/my-bookings");
    return response.data;
};

export const getBookingById = async (bookingId: string) => {
    const response = await axiosInstance.get(`/bookings/${bookingId}`);
    return response.data;
};

export const cancelBooking = async (bookingId: string) => {
    const response = await axiosInstance.post(`/bookings/${bookingId}/cancel`);
    return response.data;
};

// Payment API - eSewa
export const initiateEsewaPayment = async (data: PaymentInitiationData) => {
    const response = await axiosInstance.post("/payments/esewa/initiate", data);
    return response.data;
};

export const verifyEsewaPayment = async (data: { transactionUuid: string }) => {
    const response = await axiosInstance.post("/payments/esewa/verify", data);
    return response.data;
};

export const checkEsewaPaymentStatus = async (data: { transactionUuid: string }) => {
    const response = await axiosInstance.post("/payments/esewa/status", data);
    return response.data;
};

