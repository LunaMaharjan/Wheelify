"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { getMyRevenue } from "@/lib/api";

export default function VendorRevenuePage() {
    const [revenue, setRevenue] = useState({
        total: 0,
        monthly: 0,
        completedRentals: 0,
        activeRentals: 0,
        totalRentals: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRevenue = async () => {
            setIsLoading(true);
            try {
                const response = await getMyRevenue();
                if (response?.success && response?.revenue) {
                    setRevenue(response.revenue);
                }
            } catch (error) {
                console.error("Failed to fetch revenue:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRevenue();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading revenue data...</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Revenue",
            value: `$${revenue.total.toLocaleString()}`,
            description: "All time earnings",
            icon: DollarSign,
        },
        {
            title: "Monthly Revenue",
            value: `$${revenue.monthly.toLocaleString()}`,
            description: "Last 30 days",
            icon: TrendingUp,
        },
        {
            title: "Completed Rentals",
            value: revenue.completedRentals.toString(),
            description: "Successfully completed",
            icon: CheckCircle,
        },
        {
            title: "Active Rentals",
            value: revenue.activeRentals.toString(),
            description: "Currently active",
            icon: Calendar,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Revenue Analytics</h2>
                <p className="text-muted-foreground">
                    Track your earnings and rental performance
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {card.title}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Summary</CardTitle>
                        <CardDescription>
                            Overview of your earnings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Rentals:</span>
                                <span className="font-semibold">{revenue.totalRentals}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Completed:</span>
                                <span className="font-semibold">{revenue.completedRentals}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Active:</span>
                                <span className="font-semibold">{revenue.activeRentals}</span>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex justify-between">
                                    <span className="text-lg font-semibold">Total Revenue:</span>
                                    <span className="text-lg font-bold text-primary">
                                        ${revenue.total.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Performance</CardTitle>
                        <CardDescription>
                            Revenue from the last 30 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-3xl font-bold text-primary">
                                ${revenue.monthly.toLocaleString()}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                This represents your earnings from rentals that were created in the
                                last 30 days.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

