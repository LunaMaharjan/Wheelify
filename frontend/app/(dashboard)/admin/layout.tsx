"use client";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import {
    LayoutDashboard,
    Users,
    Store,
    Settings,
    LogOut,
    User,
} from "lucide-react";
import Link from "next/link";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const adminNavItems = [
    {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Users",
        url: "/admin/users",
        icon: Users,
    },
    {
        title: "Vendors",
        url: "/admin/vendors",
        icon: Store,
    },
    {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
    },
];

export default function AdminLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const { requireAdmin, user, logout } = useAuthGuard();
    const router = useRouter();

    useEffect(() => {
        if (!requireAdmin("/login")) {
            return;
        }
    }, [requireAdmin]);

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const getUserInitials = (name?: string) => {
        if (!name) return "A";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b border-sidebar-border p-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                            W
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Wheelify</span>
                            <span className="text-xs text-muted-foreground">Admin Panel</span>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <NavMain items={adminNavItems} />
                </SidebarContent>
                <SidebarFooter className="border-t border-sidebar-border p-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.image} alt={user?.name} />
                                <AvatarFallback>
                                    {getUserInitials(user?.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium truncate">
                                    {user?.name || "Admin"}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                    {user?.email}
                                </span>
                            </div>
                        </div>
                        <Separator />
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    className="w-full justify-start"
                                >
                                    <Link href="/admin/profile">
                                        <User className="h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={handleLogout}
                                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </div>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
