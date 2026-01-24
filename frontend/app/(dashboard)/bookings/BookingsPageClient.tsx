"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Search,
    Loader2,
    Calendar,
    DollarSign,
    MapPin,
    Eye,
    Trash2,
} from "lucide-react";
import { getUserBookings, cancelBooking } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import Navbar from "@/components/Navigation";

interface Booking {
    _id: string;
    vehicleId: {
        _id: string;
        name: string;
        category?: string;
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

interface BookingsPageClientProps {
    initialBookings?: Booking[];
}

export default function BookingsPageClient({ initialBookings = [] }: BookingsPageClientProps) {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>(initialBookings);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("rental-history");
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            setIsLoading(true);
            try {
                const response = await getUserBookings();
                if (response?.success && response?.data) {
                    setBookings(response.data);
                    setFilteredBookings(response.data);
                } else {
                    setBookings([]);
                    setFilteredBookings([]);
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

        fetchBookings();
    }, []);

    useEffect(() => {
        let filtered = bookings;
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Filter by tab
        if (activeTab === "rental-history") {
            // Show bookings where end date has passed (rental history)
            filtered = filtered.filter((booking) => {
                const endDate = new Date(booking.endDate);
                endDate.setHours(0, 0, 0, 0);
                return endDate < currentDate && booking.bookingStatus !== "cancelled";
            });
        } else if (activeTab === "active") {
            // Show active bookings (end date hasn't passed)
            filtered = filtered.filter((booking) => {
                const endDate = new Date(booking.endDate);
                endDate.setHours(0, 0, 0, 0);
                return endDate >= currentDate && 
                       (booking.bookingStatus === "pending" || 
                        booking.bookingStatus === "confirmed" || 
                        booking.bookingStatus === "active");
            });
        } else if (activeTab !== "all") {
            filtered = filtered.filter((booking) => booking.bookingStatus === activeTab);
        }

        // Filter by search query
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (booking) =>
                    booking.vehicleId.name.toLowerCase().includes(query) ||
                    booking._id.toLowerCase().includes(query)
            );
        }

        setFilteredBookings(filtered);
    }, [searchQuery, bookings, activeTab]);

    const handleCancelClick = (booking: Booking) => {
        setSelectedBooking(booking);
        setShowCancelDialog(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedBooking) return;

        try {
            setCancellingId(selectedBooking._id);
            const response = await cancelBooking(selectedBooking._id);

            if (!response.success) {
                throw new Error(response.message || "Failed to cancel booking");
            }

            // Update bookings list
            setBookings((prev) =>
                prev.map((b) =>
                    b._id === selectedBooking._id
                        ? { ...b, bookingStatus: "cancelled" as const }
                        : b
                )
            );

            toast.success("Booking cancelled successfully");
            setShowCancelDialog(false);
            setSelectedBooking(null);
        } catch (error: any) {
            console.error("Cancel booking error:", error);
            toast.error("Failed to cancel booking", {
                description: error.response?.data?.message || error.message,
            });
        } finally {
            setCancellingId(null);
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

    const canCancelBooking = (booking: Booking) => {
        return (
            booking.bookingStatus !== "cancelled" &&
            booking.bookingStatus !== "completed" &&
            new Date(booking.startDate) > new Date()
        );
    };

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const rentalHistory = bookings.filter((b) => {
        const endDate = new Date(b.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate < currentDate && b.bookingStatus !== "cancelled";
    });

    const activeBookings = bookings.filter((b) => {
        const endDate = new Date(b.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate >= currentDate && 
               (b.bookingStatus === "pending" || 
                b.bookingStatus === "confirmed" || 
                b.bookingStatus === "active");
    });

    const statusCounts = {
        all: bookings.length,
        "rental-history": rentalHistory.length,
        active: activeBookings.length,
        pending: bookings.filter((b) => b.bookingStatus === "pending").length,
        confirmed: bookings.filter((b) => b.bookingStatus === "confirmed").length,
        completed: bookings.filter((b) => b.bookingStatus === "completed").length,
        cancelled: bookings.filter((b) => b.bookingStatus === "cancelled").length,
    };

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header Section */}
        <Navbar />
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Rental History</h2>
                <p className="text-muted-foreground">
                    View your past and active vehicle rentals
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Bookings</CardTitle>
                            <CardDescription>
                                A comprehensive list of all your bookings
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
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="rental-history">Rental History ({statusCounts["rental-history"]})</TabsTrigger>
                            <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
                            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
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
                                        : activeTab === "rental-history"
                                        ? "No rental history found"
                                        : activeTab === "active"
                                        ? "No active bookings found"
                                        : activeTab === "all"
                                        ? "No bookings found"
                                        : `No ${activeTab} bookings found`}
                                    {bookings.length === 0 && (
                                        <div className="mt-4">
                                            <Link href="/rent">
                                                <Button>Browse Vehicles</Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Booking ID</TableHead>
                                                <TableHead>Vehicle</TableHead>
                                                <TableHead>Rental Period</TableHead>
                                                <TableHead>Pickup Location</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Booking Status</TableHead>
                                                <TableHead>Payment Status</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead>Actions</TableHead>
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
                                                            <span className="font-medium">{booking.vehicleId.name}</span>
                                                            <span className="text-xs text-muted-foreground capitalize">
                                                                {booking.vehicleId.category || "N/A"}
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
                                                                Rs. {booking.totalAmount.toLocaleString("en-US", {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            Rs. {booking.pricePerDay.toLocaleString("en-US", {
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
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Link href={`/rent/confirmation?bookingId=${booking._id}`}>
                                                                <Button variant="outline" size="sm" className="gap-1">
                                                                    <Eye className="h-3 w-3" />
                                                                    View
                                                                </Button>
                                                            </Link>
                                                            {canCancelBooking(booking) && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleCancelClick(booking)}
                                                                    disabled={cancellingId === booking._id}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                    Cancel
                                                                </Button>
                                                            )}
                                                        </div>
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

            {/* Cancel Confirmation Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this booking? This action cannot be undone.
                            {selectedBooking && (
                                <div className="mt-2 text-sm">
                                    <p><strong>Vehicle:</strong> {selectedBooking.vehicleId.name}</p>
                                    <p><strong>Dates:</strong> {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}</p>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCancelDialog(false);
                                setSelectedBooking(null);
                            }}
                            disabled={cancellingId !== null}
                        >
                            Keep Booking
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmCancel}
                            disabled={cancellingId !== null}
                        >
                            {cancellingId ? "Cancelling..." : "Cancel Booking"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </div>
    );
}

