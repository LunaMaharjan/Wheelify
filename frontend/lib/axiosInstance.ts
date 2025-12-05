import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL;
if (!baseURL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in .env file");
}

const axiosInstance = axios.create({
    baseURL: `${baseURL}/api`,
    timeout: 30000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Let layouts handle authentication redirects
        // Don't redirect here - let the route-specific layouts decide
        return Promise.reject(error);
    }
);

export default axiosInstance;