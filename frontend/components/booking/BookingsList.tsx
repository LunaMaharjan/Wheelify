"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, DollarSign, AlertCircle, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getUserBookings, cancelBooking } from "@/lib/api";

interface Booking {
    _id: string;
    vehicleId: {
        _id: string;
        name: string;
        type: string;
        images?: string[];
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

interface BookingsListProps {
    showHeader?: boolean;
}

const BookingsList: React.FC<BookingsListProps> = ({ showHeader = true }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmData, setDeleteConfirmData] = useState<{
        id: string;
        name: string;
    } | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await getUserBookings();

                if (!response.success) {
                    throw new Error(response.message || "Failed to fetch bookings");
                }

                setBookings(response.data || []);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load bookings";
                setError(errorMessage);
                console.error("Fetch bookings error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const handleCancelClick = (booking: Booking) => {
        setDeleteConfirmData({
            id: booking._id,
            name: `${booking.vehicleId.name} (${format(new Date(booking.startDate), "MMM dd, yyyy")})`,
        });
        setShowDeleteDialog(true);
    };

    const handleConfirmCancel = async () => {
        if (!deleteConfirmData) return;

        try {
            setCancellingId(deleteConfirmData.id);
            const response = await cancelBooking(deleteConfirmData.id);

            if (!response.success) {
                throw new Error(response.message || "Failed to cancel booking");
            }

            // Update bookings list
            setBookings((prev: Booking[]) =>
                prev.map((b: Booking) =>
                    b._id === deleteConfirmData.id
                        ? { ...b, bookingStatus: "cancelled" as const }
                        : b
                )
            );

            setShowDeleteDialog(false);
            setDeleteConfirmData(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to cancel booking";
            setError(errorMessage);
            console.error("Cancel booking error:", err);
        } finally {
            setCancellingId(null);
        }
    };

    const getStatusColor = (
        status: "pending" | "confirmed" | "active" | "completed" | "cancelled"
    ) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "confirmed":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case "completed":
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
            case "cancelled":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
        }
    };

    const getPaymentStatusColor = (status: "pending" | "paid" | "refunded") => {
        switch (status) {
            case "pending":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
            case "paid":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case "refunded":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
        }
    };

    const canCancelBooking = (booking: Booking) => {
        return (
            booking.bookingStatus !== "cancelled" &&
            booking.bookingStatus !== "completed" &&
            new Date(booking.startDate) > new Date()
        );
    };

    const filteredBookings =
        filterStatus === "all"
            ? bookings
            : bookings.filter((b: Booking) => b.bookingStatus === filterStatus);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-32 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            {showHeader && (
                <div>
                    <h2 className="text-2xl font-bold">My Bookings</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage and track your vehicle bookings
                    </p>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <Alert className="bg-red-50 dark:bg-red-950 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-600 dark:text-red-400">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* Filter Tabs */}
            {bookings.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {["all", "pending", "confirmed", "active", "completed", "cancelled"].map(
                        (status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${filterStatus === status
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    }`}
                            >
                                {status === "all" ? "All Bookings" : status}
                            </button>
                        )
                    )}
                </div>
            )}

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No bookings found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {bookings.length === 0
                            ? "You haven't made any bookings yet"
                            : "No bookings match the selected filter"}
                    </p>
                    {bookings.length === 0 && (
                        <Link href="/rent">
                            <Button>Browse Vehicles</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredBookings.map((booking: Booking) => (
                        <div
                            key={booking._id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6 space-y-4">
                                {/* Header Row */}
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {booking.vehicleId.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                            Type: {booking.vehicleId.type}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:items-end gap-2">
                                        <div className="flex gap-2">
                                            <Badge className={getStatusColor(booking.bookingStatus)}>
                                                {booking.bookingStatus.charAt(0).toUpperCase() +
                                                    booking.bookingStatus.slice(1)}
                                            </Badge>
                                            <Badge
                                                className={getPaymentStatusColor(booking.paymentStatus)}
                                            >
                                                {booking.paymentStatus === "paid" ? "✓ Paid" : booking.paymentStatus.charAt(0).toUpperCase() +
                                                    booking.paymentStatus.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Dates */}
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                                            Check-in
                                        </p>
                                        <p className="font-semibold text-sm">
                                            {format(new Date(booking.startDate), "MMM dd, yyyy")}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                                            Check-out
                                        </p>
                                        <p className="font-semibold text-sm">
                                            {format(new Date(booking.endDate), "MMM dd, yyyy")}
                                        </p>
                                    </div>

                                    {/* Duration */}
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                                            Duration
                                        </p>
                                        <p className="font-semibold text-sm">
                                            {booking.totalDays} day{booking.totalDays !== 1 ? "s" : ""}
                                        </p>
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                                            Total Amount
                                        </p>
                                        <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                            Rs. {booking.totalAmount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Location */}
                                {booking.pickupLocation && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                                        <div className="text-sm">
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {booking.pickupLocation.address}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {booking.pickupLocation.city}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Link href={`/rent/confirmation?bookingId=${booking._id}`}>
                                        <Button
                                            variant="outline"
                                            className="gap-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Details
                                        </Button>
                                    </Link>

                                    {canCancelBooking(booking) && (
                                        <Button
                                            variant="outline"
                                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                            onClick={() => handleCancelClick(booking)}
                                            disabled={cancellingId === booking._id}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {cancellingId === booking._id ? "Cancelling..." : "Cancel"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this booking? {deleteConfirmData?.name ? `(${deleteConfirmData.name})` : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setDeleteConfirmData(null);
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
    );
};

export default BookingsList;
