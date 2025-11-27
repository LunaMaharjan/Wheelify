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

let isHandlingUnauthorized = false;

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        if (status === 401 && typeof window !== "undefined") {
            if (!isHandlingUnauthorized) {
                isHandlingUnauthorized = true;
                try {
                    const currentPath = window.location.pathname;
                    if (!currentPath.startsWith("/login")) {
                        const redirect = encodeURIComponent(window.location.href);
                        window.location.href = `/login?next=${redirect}`;
                    }
                } finally {
                    setTimeout(() => {
                        isHandlingUnauthorized = false;
                    }, 1500);
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;