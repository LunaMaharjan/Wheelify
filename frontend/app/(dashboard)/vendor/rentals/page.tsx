"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar } from "lucide-react";
import { getMyRentals } from "@/lib/api";

interface Rental {
    _id: string;
    vehicleId: {
        _id: string;
        name: string;
        type: string;
    };
    customerId: {
        _id: string;
        name: string;
        email: string;
    };
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
}

export default function VendorRentalsPage() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRentals = async () => {
            setIsLoading(true);
            try {
                const response = await getMyRentals();
                if (response?.success && response?.rentals) {
                    setRentals(response.rentals);
                }
            } catch (error) {
                console.error("Failed to fetch rentals:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRentals();
    }, []);

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "completed":
                return "default";
            case "active":
                return "secondary";
            case "confirmed":
                return "default";
            case "cancelled":
                return "destructive";
            default:
                return "outline";
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading rentals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">My Rentals</h2>
                <p className="text-muted-foreground">
                    View and manage rental bookings
                </p>
            </div>

            {rentals.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No rentals yet</h3>
                        <p className="text-muted-foreground text-center">
                            Your rental bookings will appear here.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Rental Bookings</CardTitle>
                        <CardDescription>
                            All rental bookings for your vehicles
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Total Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rentals.map((rental) => (
                                        <TableRow key={rental._id}>
                                            <TableCell className="font-medium">
                                                {rental.vehicleId?.name || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {rental.customerId?.name || "N/A"}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {rental.customerId?.email || "N/A"}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatDate(rental.startDate)}</TableCell>
                                            <TableCell>{formatDate(rental.endDate)}</TableCell>
                                            <TableCell>${rental.totalPrice}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(rental.status)}>
                                                    {rental.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        rental.paymentStatus === "paid"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {rental.paymentStatus}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

