import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL;
if (!baseURL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in .env file");
}

// CSRF token management
let csrfToken: string | null = null;

// Function to get CSRF token
const getCsrfToken = async () => {
    if (csrfToken) return csrfToken;

    try {
        // Get CSRF cookie from Laravel Sanctum
        await axios.get(`${baseURL}/sanctum/csrf-cookie`, {
            withCredentials: true,
        });

        // Extract CSRF token from cookies
        const cookies = document.cookie.split(';');
        const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));

        if (csrfCookie) {
            csrfToken = decodeURIComponent(csrfCookie.split('=')[1]);
        }

        return csrfToken;
    } catch (error) {
        console.error('Failed to get CSRF token:', error);
        return null;
    }
};


// Main axios instance with interceptors
const axiosInstance = axios.create({
    baseURL: `${baseURL}/api`,
    timeout: 1000000,
    withCredentials: true, // Important for cookies
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

// Request interceptor to add CSRF token and authorization header
axiosInstance.interceptors.request.use(
    async (config) => {
        // Get CSRF token for non-GET requests
        if (config.method !== 'get' && config.method !== 'GET') {
            const token = await getCsrfToken();
            if (token) {
                config.headers['X-XSRF-TOKEN'] = token;
            }
        }

        // Add authorization header if token exists (client-only)
        if (typeof window !== 'undefined') {
            const authToken = localStorage.getItem("authToken") || localStorage.getItem("token");
            if (authToken) {
                config.headers.Authorization = `Bearer ${authToken}`;
            }
        }

        return config;
    },
    (error) => {
        console.error("Failed to add token to request header:", error);
        return Promise.reject(error);
    }
);

// Guard to avoid multiple redirects firing at once
let isHandlingUnauthorized = false;

// Response interceptor to handle 401 Unauthorized globally
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        if (status === 401 && typeof window !== 'undefined') {
            if (!isHandlingUnauthorized) {
                isHandlingUnauthorized = true;
                try {
                    // Clear any stored auth tokens
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('token');

                    const currentPath = window.location.pathname;
                    // Avoid redirect loop if already on login
                    if (!currentPath.startsWith('/login')) {
                        const redirect = encodeURIComponent(window.location.href);
                        window.location.href = `/login?next=${redirect}`;
                    }
                } finally {
                    // Reset the flag after a short delay to prevent rapid loops
                    setTimeout(() => { isHandlingUnauthorized = false; }, 1500);
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;