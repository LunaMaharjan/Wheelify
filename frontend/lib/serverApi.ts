import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in .env file");
}

// Server-side axios instance - simplified version of axiosInstance.ts
// without client-side dependencies like document, localStorage, window
const serverAxiosInstance = axios.create({
    baseURL: `${baseURL}/api`,
    timeout: 10000, // Shorter timeout for server-side
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

// Request interceptor for server-side (without client-specific features)
serverAxiosInstance.interceptors.request.use(
    async (config) => {
        // For server-side, we don't need CSRF tokens or auth headers
        // since these are typically for public API endpoints
        return config;
    },
    (error) => {
        console.error("Server API request error:", error);
        return Promise.reject(error);
    }
);

// Response interceptor for server-side error handling
serverAxiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        console.error("Server API response error:", error);
        return Promise.reject(error);
    }
);

export default serverAxiosInstance;
