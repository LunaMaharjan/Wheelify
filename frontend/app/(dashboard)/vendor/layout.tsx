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
    Car,
    Calendar,
    DollarSign,
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

const vendorNavItems = [
    {
        title: "Dashboard",
        url: "/vendor",
        icon: LayoutDashboard,
    },
    {
        title: "Vehicles",
        url: "/vendor/vehicles",
        icon: Car,
    },
    {
        title: "Rentals",
        url: "/vendor/rentals",
        icon: Calendar,
    },
    {
        title: "Revenue",
        url: "/vendor/revenue",
        icon: DollarSign,
    },
];

export default function VendorLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const { requireVendor, user, logout } = useAuthGuard();
    const router = useRouter();

    useEffect(() => {
        if (!requireVendor("/login")) {
            return;
        }
    }, [requireVendor]);

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const getUserInitials = (name?: string) => {
        if (!name) return "V";
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
                            <Link href="/" className="text-sm font-semibold">Wheelify</Link>
                            <span className="text-xs text-muted-foreground">Vendor Dashboard</span>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <NavMain items={vendorNavItems} />
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
                                    {user?.name || "Vendor"}
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
                                    <Link href="/profile">
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
                        <h1 className="text-lg font-semibold">Vendor Dashboard</h1>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

