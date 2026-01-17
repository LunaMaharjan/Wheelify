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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Loader2,
    Calendar,
    DollarSign,
    MapPin,
} from "lucide-react";
import { getAllBookings } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Booking {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        contact?: string;
    };
    vehicleId: {
        _id: string;
        name: string;
        category: string;
        mainImage?: string;
        pricePerDay: number;
    };
    startDate: string;
    endDate: string;
    totalDays: number;
    totalAmount: number;
    pricePerDay: number;
    bookingStatus: "pending" | "confirmed" | "active" | "completed" | "cancelled";
    paymentStatus: "pending" | "paid" | "refunded";
    pickupLocation?: {
        address: string;
        city: string;
    };
    createdAt: string;
}

export default function BookingsManagementPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        let filtered = bookings;

        // Filter by tab
        if (activeTab !== "all") {
            filtered = filtered.filter((booking) => booking.bookingStatus === activeTab);
        }

        // Filter by search query
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (booking) =>
                    booking.userId.name.toLowerCase().includes(query) ||
                    booking.userId.email.toLowerCase().includes(query) ||
                    booking.vehicleId.name.toLowerCase().includes(query) ||
                    booking._id.toLowerCase().includes(query)
            );
        }

        setFilteredBookings(filtered);
    }, [searchQuery, bookings, activeTab]);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const response = await getAllBookings();
            if (response?.success && response?.bookings) {
                setBookings(response.bookings);
                setFilteredBookings(response.bookings);
            }
        } catch (error: any) {
            console.error("Failed to fetch bookings:", error);
            toast.error("Failed to fetch bookings", {
                description: error.response?.data?.message || "An error occurred while fetching bookings",
            });
            setBookings([]);
            setFilteredBookings([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getBookingStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            pending: "secondary",
            confirmed: "default",
            active: "default",
            completed: "outline",
            cancelled: "destructive",
        };

        return (
            <Badge variant={variants[status] || "outline"} className="capitalize">
                {status}
            </Badge>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            pending: "secondary",
            paid: "default",
            refunded: "outline",
        };

        return (
            <Badge variant={variants[status] || "outline"} className="capitalize">
                {status}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "MMM dd, yyyy");
    };

    const formatDateTime = (dateString: string) => {
        return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    };

    const statusCounts = {
        all: bookings.length,
        pending: bookings.filter((b) => b.bookingStatus === "pending").length,
        confirmed: bookings.filter((b) => b.bookingStatus === "confirmed").length,
        active: bookings.filter((b) => b.bookingStatus === "active").length,
        completed: bookings.filter((b) => b.bookingStatus === "completed").length,
        cancelled: bookings.filter((b) => b.bookingStatus === "cancelled").length,
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Bookings Management</h2>
                <p className="text-muted-foreground">
                    View and manage all vehicle bookings
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Bookings</CardTitle>
                            <CardDescription>
                                A comprehensive list of all bookings in the platform
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search bookings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-6">
                            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
                            <TabsTrigger value="confirmed">Confirmed ({statusCounts.confirmed})</TabsTrigger>
                            <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
                            <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
                            <TabsTrigger value="cancelled">Cancelled ({statusCounts.cancelled})</TabsTrigger>
                        </TabsList>
                        <TabsContent value={activeTab} className="mt-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : filteredBookings.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    {searchQuery
                                        ? "No bookings found matching your search"
                                        : activeTab === "all"
                                        ? "No bookings found"
                                        : `No ${activeTab} bookings found`}
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Booking ID</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Vehicle</TableHead>
                                                <TableHead>Rental Period</TableHead>
                                                <TableHead>Pickup Location</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Booking Status</TableHead>
                                                <TableHead>Payment Status</TableHead>
                                                <TableHead>Created</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredBookings.map((booking) => (
                                                <TableRow key={booking._id}>
                                                    <TableCell className="font-mono text-xs">
                                                        {booking._id.slice(-8)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{booking.userId.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {booking.userId.email}
                                                            </span>
                                                            {booking.userId.contact && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {booking.userId.contact}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{booking.vehicleId.name}</span>
                                                            <span className="text-xs text-muted-foreground capitalize">
                                                                {booking.vehicleId.category}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                                <span>{formatDate(booking.startDate)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                                <span>{formatDate(booking.endDate)}</span>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {booking.totalDays} day{booking.totalDays !== 1 ? "s" : ""}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {booking.pickupLocation ? (
                                                            <div className="flex items-start gap-1">
                                                                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm">{booking.pickupLocation.address}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {booking.pickupLocation.city}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">
                                                                {booking.totalAmount.toLocaleString("en-US", {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {booking.pricePerDay.toLocaleString("en-US", {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{" "}
                                                            / day
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getBookingStatusBadge(booking.bookingStatus)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getPaymentStatusBadge(booking.paymentStatus)}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {formatDateTime(booking.createdAt)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

