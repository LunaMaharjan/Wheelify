//@ts-nocheck

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        // Allow all remote image domains (http and https)
        remotePatterns: [
            { protocol: "https", hostname: "**" },
            { protocol: "http", hostname: "**" },
        ],
        // Optionally bypass Next image optimization during local dev to avoid proxy timeouts
        unoptimized: process.env.NODE_ENV !== 'production',
    },
};

export default nextConfig;
