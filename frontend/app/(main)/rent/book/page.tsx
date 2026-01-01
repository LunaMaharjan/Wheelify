"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ChevronLeft, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BookingForm from "@/components/booking/BookingForm";
import BookingSummary from "@/components/booking/BookingSummary";
import PaymentForm from "@/components/booking/PaymentForm";
import { getVehicleById } from "@/lib/api";

interface Vehicle {
    _id: string;
    name: string;
    type: string;
    pricePerDay: number;
    pickupLocation?: {
        address: string;
        city: string;
    };
    images?: string[];
}

interface BookingData {
    startDate: string;
    endDate: string;
    totalDays: number;
    totalAmount: number;
}

type Step = "form" | "summary" | "payment";


const BookingPage= () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const vehicleId = searchParams.get("vehicleId");
    const [currentStep, setCurrentStep] = useState<Step>("form");
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [bookingData, setBookingData] = useState<BookingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch vehicle details on mount
    useEffect(() => {
        if (!vehicleId) {
            setError("Vehicle ID is required");
            setIsLoading(false);
            return;
        }

        const fetchVehicle = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await getVehicleById(vehicleId);
                console.log("Vehicle fetch response:", response);
                if (!response.success) {
                    throw new Error(response.message || "Failed to fetch vehicle");
                }

                setVehicle(response.vehicle);
                console.log(response.vehicle.pricePerDay)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to fetch vehicle details";
                setError(errorMessage);
                console.error("Vehicle fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVehicle();
    }, [vehicleId]);

    // Handle booking form submission
    const handleBookingFormSubmit = async (data: BookingData) => {
        setBookingData(data);
        setCurrentStep("summary");
    };

    // Handle back from summary
    const handleBackFromSummary = () => {
        setCurrentStep("form");
    };

    // Handle continue to payment
    const handleContinueToPayment = () => {
        setCurrentStep("payment");
    };

    // Handle back from payment
    const handleBackFromPayment = () => {
        setCurrentStep("summary");
    };

    // Handle payment initiation success
    const handlePaymentInitiated = (transactionUuid: string) => {
        // Transaction UUID is stored in PaymentForm
        // After eSewa redirects back, the user will be handled by callback
        console.log("Payment initiated with transaction UUID:", transactionUuid);
    };

    // Handle payment error
    const handlePaymentError = (errorMsg: string) => {
        setError(errorMsg);
        setCurrentStep("payment");
    };

    // Handle go back to vehicle
    const handleGoBack = () => {
        router.back();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600 dark:text-gray-400">Loading vehicle details...</p>
                </div>
            </div>
        );
    }

    if (error || !vehicle) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    <Button
                        variant="outline"
                        onClick={handleGoBack}
                        className="mb-6"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>

                    <Alert className="bg-red-50 dark:bg-red-950 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-600 dark:text-red-400">
                            {error || "Failed to load vehicle details"}
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="outline"
                        onClick={handleGoBack}
                        className="mb-4"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <h1 className="text-3xl font-bold">Book Your Vehicle</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Step {currentStep === "form" ? 1 : currentStep === "summary" ? 2 : 3} of 3
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="mb-8 flex items-center gap-2">
                    <div
                        className={`flex-1 h-2 rounded-full transition-colors ${currentStep === "form" || currentStep === "summary" || currentStep === "payment"
                            ? "bg-blue-600"
                            : "bg-gray-300 dark:bg-gray-700"
                            }`}
                    />
                    <div
                        className={`flex-1 h-2 rounded-full transition-colors ${currentStep === "summary" || currentStep === "payment"
                            ? "bg-blue-600"
                            : "bg-gray-300 dark:bg-gray-700"
                            }`}
                    />
                    <div
                        className={`flex-1 h-2 rounded-full transition-colors ${currentStep === "payment"
                            ? "bg-blue-600"
                            : "bg-gray-300 dark:bg-gray-700"
                            }`}
                    />
                </div>

                {/* Error Alert */}
                {error && currentStep !== "form" && (
                    <Alert className="mb-6 bg-red-50 dark:bg-red-950 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-600 dark:text-red-400">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Form/Payment */}
                    <div className="lg:col-span-2">
                        {currentStep === "form" && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                                <h2 className="text-2xl font-bold mb-6">Select Your Dates</h2>
                                <BookingForm
                                    vehicle={vehicle}
                                    onSubmit={handleBookingFormSubmit}
                                    isLoading={false}
                                />
                            </div>
                        )}

                        {currentStep === "summary" && bookingData && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                                    <h2 className="text-2xl font-bold mb-6">Review Your Booking</h2>
                                    <BookingSummary
                                        vehicle={vehicle}
                                        bookingDetails={bookingData}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleBackFromSummary}
                                        className="flex-1 py-6 text-base font-semibold"
                                    >
                                        ← Edit Dates
                                    </Button>
                                    <Button
                                        onClick={handleContinueToPayment}
                                        className="flex-1 py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                                    >
                                        Continue to Payment →
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === "payment" && bookingData && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                                    <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
                                    <PaymentForm
                                        bookingData={{
                                            vehicleId: vehicle._id,
                                            startDate: bookingData.startDate,
                                            endDate: bookingData.endDate,
                                            totalDays: bookingData.totalDays,
                                            pricePerDay: vehicle.pricePerDay,
                                            totalAmount: bookingData.totalAmount,
                                        }}
                                        onPaymentInitiated={handlePaymentInitiated}
                                        onError={handlePaymentError}
                                    />
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={handleBackFromPayment}
                                    className="w-full py-6 text-base font-semibold"
                                >
                                    ← Back to Review
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm sticky top-6">
                            <h3 className="text-xl font-bold mb-4">Booking Summary</h3>

                            {vehicle && (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle</p>
                                        <p className="font-semibold">{vehicle.name}</p>
                                    </div>

                                    {bookingData && (
                                        <>
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Duration
                                                </p>
                                                <p className="font-semibold">
                                                    {bookingData.totalDays} day{bookingData.totalDays !== 1 ? "s" : ""}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Rate
                                                </p>
                                                <p className="font-semibold">Rs. {vehicle.pricePerDay}/day</p>
                                            </div>

                                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                    Total
                                                </p>
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    Rs. {bookingData.totalAmount.toFixed(2)}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
