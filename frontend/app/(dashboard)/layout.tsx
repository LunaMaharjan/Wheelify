"use client";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function DashboardLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const { requireAuth } = useAuthGuard();
    if (!requireAuth("/login")) {
        return null;
    }
    return children;
}