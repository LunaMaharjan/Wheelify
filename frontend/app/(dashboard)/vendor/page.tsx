"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Calendar, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { getMyVehicles, getMyRentals, getMyRevenue } from "@/lib/api";

export default function VendorDashboardPage() {
    const [stats, setStats] = useState({
        totalVehicles: 0,
        totalRentals: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeRentals: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const [vehiclesRes, rentalsRes, revenueRes] = await Promise.all([
                    getMyVehicles(),
                    getMyRentals(),
                    getMyRevenue(),
                ]);

                setStats({
                    totalVehicles: vehiclesRes?.vehicles?.length || 0,
                    totalRentals: rentalsRes?.rentals?.length || 0,
                    totalRevenue: revenueRes?.revenue?.total || 0,
                    monthlyRevenue: revenueRes?.revenue?.monthly || 0,
                    activeRentals: revenueRes?.revenue?.activeRentals || 0,
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: "Total Vehicles",
            value: stats.totalVehicles.toString(),
            description: "Vehicles in your inventory",
            icon: Car,
            bg: "from-indigo-500/90 to-indigo-600",
            iconColor: "text-indigo-50",
        },
        {
            title: "Total Rentals",
            value: stats.totalRentals.toString(),
            description: "All time rentals",
            icon: Calendar,
            bg: "from-emerald-500/90 to-emerald-600",
            iconColor: "text-emerald-50",
        },
        {
            title: "Total Revenue",
            value: `$${stats.totalRevenue.toLocaleString()}`,
            description: "All time earnings",
            icon: DollarSign,
            bg: "from-amber-500/90 to-amber-600",
            iconColor: "text-amber-50",
        },
        {
            title: "Monthly Revenue",
            value: `$${stats.monthlyRevenue.toLocaleString()}`,
            description: "Last 30 days",
            icon: TrendingUp,
            bg: "from-sky-500/90 to-sky-600",
            iconColor: "text-sky-50",
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card
                            key={card.title}
                            className={`bg-gradient-to-br ${card.bg} text-white border-0 shadow-md`}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-white/90">
                                    {card.title}
                                </CardTitle>
                                <span className="rounded-full bg-white/15 p-2 backdrop-blur">
                                    <Icon className={`h-4 w-4 ${card.iconColor}`} />
                                </span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold drop-shadow-sm">{card.value}</div>
                                <p className="text-xs text-white/80 mt-1">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border border-sky-100/60 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-sky-500 shadow-sm" />
                            Active Rentals
                        </CardTitle>
                        <CardDescription>Currently active rental bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-sky-700">{stats.activeRentals}</div>
                        <p className="text-sm text-muted-foreground mt-2">Vehicles currently on rent</p>
                    </CardContent>
                </Card>

                <Card className="border border-amber-100/70 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500 shadow-sm" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>Common vendor tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1">
                                Add new vehicles
                            </span>
                            <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1">
                                Manage bookings
                            </span>
                            <span className="rounded-full bg-sky-100 text-sky-800 px-3 py-1">
                                Track earnings
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

