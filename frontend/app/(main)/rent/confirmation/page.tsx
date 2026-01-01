"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, MapPin, Calendar, Clock, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getBookingById } from "@/lib/api";

interface Booking {
    _id: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    totalAmount: number;
    pricePerDay: number;
    bookingStatus: string;
    paymentStatus: string;
    pickupLocation?: {
        address: string;
        city: string;
    };
    vehicleId?: {
        name: string;
        type: string;
    };
    userId?: {
        name: string;
        email: string;
        contact?: string;
    };
    createdAt?: string;
}

const BookingConfirmationPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("bookingId");
    const status = searchParams.get("status");

    const [booking, setBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!bookingId) {
            setError("Booking ID not found");
            setIsLoading(false);
            return;
        }

        if (status === "failed") {
            setError("Payment was not completed. Please try again.");
            setIsLoading(false);
            return;
        }

        const fetchBooking = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await getBookingById(bookingId);

                if (!response.success || !response.data) {
                    throw new Error(response.message || "Failed to fetch booking details");
                }

                setBooking(response.data);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load booking details";
                setError(errorMessage);
                console.error("Booking fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId, status]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
        });
    };

    if (error && !booking) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Failed</h1>
                    </div>

                    <Alert className="bg-red-50 dark:bg-red-950 border-red-200 mb-8">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-600 dark:text-red-400">
                            {error}
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                        <Link href="/rent">
                            <Button className="w-full py-6 text-base font-semibold">
                                Browse Vehicles
                            </Button>
                        </Link>
                        <Link href="/profile/bookings">
                            <Button variant="outline" className="w-full py-6 text-base font-semibold">
                                View My Bookings
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Booking details not found
                    </h1>
                </div>
            </div>
        );
    }

    const isConfirmed = booking.bookingStatus === "confirmed" && booking.paymentStatus === "paid";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-8">
                    {isConfirmed ? (
                        <>
                            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Booking Confirmed!
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Your vehicle has been successfully reserved
                            </p>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-20 h-20 text-yellow-600 mx-auto mb-4" />
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Booking Pending
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Your booking is awaiting confirmation
                            </p>
                        </>
                    )}
                </div>

                {/* Booking Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
                    {/* Booking ID */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Booking ID</p>
                        <p className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {booking._id}
                        </p>
                    </div>

                    {/* Vehicle Information */}
                    {booking.vehicleId && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg">Vehicle Details</h3>
                            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                                <p className="text-lg font-semibold">{booking.vehicleId.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                    Type: {booking.vehicleId.type}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Rental Period */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Rental Period
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    Check-in
                                </p>
                                <p className="font-semibold">{formatDateTime(booking.startDate)}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    Check-out
                                </p>
                                <p className="font-semibold">{formatDateTime(booking.endDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                                Total Duration: <span className="font-semibold">{booking.totalDays} days</span>
                            </span>
                        </div>
                    </div>

                    {/* Pickup Location */}
                    {booking.pickupLocation && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center">
                                <MapPin className="w-5 h-5 mr-2" />
                                Pickup Location
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                <p className="font-semibold">{booking.pickupLocation.address}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {booking.pickupLocation.city}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Cost Breakdown */}
                    <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="font-semibold text-lg">Cost Breakdown</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Rs. {booking.pricePerDay} × {booking.totalDays} days
                                </span>
                                <span className="font-medium">
                                    Rs. {(booking.pricePerDay * booking.totalDays).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span>Total Paid</span>
                                <span className="text-green-600 dark:text-green-400">
                                    Rs. {booking.totalAmount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status Alert */}
                    {isConfirmed ? (
                        <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-600 dark:text-green-400">
                                Your payment has been received and your booking is confirmed. A confirmation email has been sent to your email address.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                                Your booking is pending confirmation. Please check your email for updates.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Important Info */}
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm text-blue-900 dark:text-blue-300 space-y-2">
                        <p className="font-semibold">Important Information:</p>
                        <ul className="space-y-1 text-xs">
                            <li>✓ Check-in time: Typically 10:00 AM</li>
                            <li>✓ Check-out time: Typically 5:00 PM</li>
                            <li>✓ Please arrive at the pickup location 15 minutes before check-in</li>
                            <li>✓ Bring a valid ID and driving license</li>
                            <li>✓ The vehicle must be returned with a full fuel tank</li>
                        </ul>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-3">
                    <Link href="/profile/bookings">
                        <Button className="w-full py-6 text-base font-semibold">
                            <Home className="w-4 h-4 mr-2" />
                            View All My Bookings
                        </Button>
                    </Link>
                    <Link href="/rent">
                        <Button variant="outline" className="w-full py-6 text-base font-semibold">
                            Browse More Vehicles
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BookingConfirmationPage;
