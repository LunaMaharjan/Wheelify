"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Home, ShoppingCart, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getBookingById } from "@/lib/api";

interface Booking {
    _id: string;
    vehicleId: {
        name: string;
        type: string;
    };
    startDate: string;
    endDate: string;
    totalDays: number;
    totalAmount: number;
    rentPerDay: number;
    bookingStatus: string;
    paymentStatus: string;
    pickupLocation?: {
        address: string;
        city: string;
    };
    createdAt: string;
}

const PaymentSuccessPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("bookingId");

    const [booking, setBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(false);

    useEffect(() => {
        if (!bookingId) {
            setIsLoading(false);
            return;
        }

        const fetchBooking = async () => {
            try {
                setIsLoading(true);
                const response = await getBookingById(bookingId);

                if (response.success && response.data) {
                    setBooking(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch booking:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId]);

    const handleCopyBookingId = () => {
        if (bookingId) {
            navigator.clipboard.writeText(bookingId);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="inline-block relative">
                        <CheckCircle className="w-24 h-24 text-green-600" />
                        <div className="absolute inset-0 bg-green-600 opacity-20 rounded-full animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
                        Payment Successful! 🎉
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        Your booking has been confirmed
                    </p>
                </div>

                {/* Main Content Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
                    {/* Booking ID Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6 rounded-xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Your Booking ID
                        </p>
                        <div className="flex items-center gap-3">
                            <code className="flex-1 font-mono text-lg font-bold text-blue-600 dark:text-blue-400 break-all">
                                {bookingId || "Loading..."}
                            </code>
                            <button
                                onClick={handleCopyBookingId}
                                className="flex-shrink-0 p-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors"
                                title="Copy booking ID"
                            >
                                {copiedId ? (
                                    <Check className="w-5 h-5 text-green-600" />
                                ) : (
                                    <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Save this ID for your records
                        </p>
                    </div>

                    {/* Booking Details */}
                    {booking && (
                        <div className="space-y-6">
                            {/* Vehicle Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                    Vehicle Details
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {booking.vehicleId.name}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize mt-1">
                                        Type: {booking.vehicleId.type}
                                    </p>
                                </div>
                            </div>

                            {/* Dates */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                    Rental Period
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            Check-in
                                        </p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {formatDate(booking.startDate)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            Check-out
                                        </p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {formatDate(booking.endDate)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                    Payment Details
                                </h3>
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Duration
                                        </span>
                                        <span className="font-medium">
                                            {booking.totalDays} day{booking.totalDays !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Rate
                                        </span>
                                        <span className="font-medium">
                                            Rs. {booking.rentPerDay}/day
                                        </span>
                                    </div>
                                    <div className="border-t border-green-200 dark:border-green-800 pt-3 flex justify-between font-bold text-lg">
                                        <span>Total Paid</span>
                                        <span className="text-green-600 dark:text-green-400">
                                            Rs. {booking.totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Pickup Location */}
                            {booking.pickupLocation && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                        Pickup Location
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {booking.pickupLocation.address}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {booking.pickupLocation.city}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Badges */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center">
                            <p className="text-xs text-green-600 dark:text-green-300 mb-1 uppercase font-semibold">
                                Booking Status
                            </p>
                            <p className="text-sm font-bold text-green-700 dark:text-green-200 capitalize">
                                {booking?.bookingStatus || "Pending"}
                            </p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center">
                            <p className="text-xs text-green-600 dark:text-green-300 mb-1 uppercase font-semibold">
                                Payment Status
                            </p>
                            <p className="text-sm font-bold text-green-700 dark:text-green-200">
                                ✓ Paid
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-3">
                    <Link href="/profile">
                        <Button className="w-full py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700">
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            View All My Bookings
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline" className="w-full py-6 text-base font-semibold">
                            <Home className="w-5 h-5 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
