"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Home, RefreshCw, HelpCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorInfo {
    code: string;
    message: string;
    description: string;
    action: string;
}

const PaymentFailedPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorCode = searchParams.get("error");

    const [showDetails, setShowDetails] = useState(false);

    // Error details mapping
    const errorMap: Record<string, ErrorInfo> = {
        booking_creation_failed: {
            code: "BOOKING_ERROR",
            message: "Booking Creation Failed",
            description:
                "We received your payment, but encountered an issue creating your booking. Our team is investigating this.",
            action: "Contact Support",
        },
        payment_cancelled: {
            code: "PAYMENT_CANCELLED",
            message: "Payment Cancelled",
            description:
                "You cancelled the payment process. Your booking was not created.",
            action: "Try Again",
        },
        payment_failed: {
            code: "PAYMENT_FAILED",
            message: "Payment Failed",
            description:
                "Your payment could not be processed. Please check your payment details and try again.",
            action: "Try Again",
        },
        invalid_amount: {
            code: "INVALID_AMOUNT",
            message: "Invalid Amount",
            description:
                "The payment amount is invalid. Please try booking again with valid dates.",
            action: "Book Again",
        },
        vehicle_unavailable: {
            code: "VEHICLE_UNAVAILABLE",
            message: "Vehicle Unavailable",
            description:
                "The vehicle is no longer available for your selected dates. Please choose different dates.",
            action: "Browse Vehicles",
        },
        transaction_failed: {
            code: "TRANSACTION_FAILED",
            message: "Transaction Failed",
            description:
                "The transaction could not be completed. Please try again or contact your bank.",
            action: "Retry",
        },
        network_error: {
            code: "NETWORK_ERROR",
            message: "Network Error",
            description:
                "There was a network error during payment processing. Please try again.",
            action: "Try Again",
        },
        missing_transaction_uuid: {
            code: "INVALID_DATA",
            message: "Invalid Payment Data",
            description:
                "The payment data is incomplete. Please start the booking process again.",
            action: "Book Again",
        },
    };

    const errorInfo =
        errorMap[errorCode || ""] ||
        errorMap["payment_failed"];

    const handleRetry = () => {
        router.push("/rent");
    };

    const handleContactSupport = () => {
        // Could open a support modal or redirect to support page
        window.location.href = "mailto:support@wheelify.com";
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Error Header */}
                <div className="text-center mb-12">
                    <div className="inline-block relative">
                        <XCircle className="w-24 h-24 text-red-600 animate-pulse" />
                        <div className="absolute inset-0 bg-red-600 opacity-10 rounded-full animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
                        Payment Failed
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        We encountered an issue with your payment
                    </p>
                </div>

                {/* Main Content Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Error Alert */}
                    <Alert className="bg-red-50 dark:bg-red-950 border-red-200">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-red-700 dark:text-red-200">
                            <p className="font-semibold mb-1">{errorInfo.message}</p>
                            <p className="text-sm">{errorInfo.description}</p>
                        </AlertDescription>
                    </Alert>

                    {/* Error Code */}
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            ERROR CODE
                        </p>
                        <code className="font-mono text-lg font-bold text-red-600 dark:text-red-400">
                            {errorInfo.code}
                        </code>
                        {errorCode && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                Technical Details: {errorCode}
                            </p>
                        )}
                    </div>


                    {/* Refund Information (if applicable) */}
                    {errorCode?.includes("payment") && (
                        <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                            <HelpCircle className="h-5 w-5 text-green-600" />
                            <AlertDescription className="text-green-700 dark:text-green-200">
                                <p className="font-semibold mb-1">💳 Refund Information</p>
                                <p className="text-sm">
                                    If money was deducted from your account, it will be refunded within 3-5 business days.
                                </p>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-3">
                    <Button
                        onClick={handleRetry}
                        className="w-full py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Try Again
                    </Button>

                    <Link href="/">
                        <Button
                            variant="ghost"
                            className="w-full py-6 text-base font-semibold"
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailedPage;
