"use client";

import React, { useState, useRef, useEffect } from "react";
import { AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { initiateEsewaPayment } from "@/lib/api";

interface BookingData {
    vehicleId: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    pricePerDay: number;
    totalAmount: number;
}

interface PaymentFormProps {
    bookingData: BookingData;
    onPaymentInitiated?: (transactionUuid: string) => void;
    onError?: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
    bookingData,
    onPaymentInitiated,
    onError,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const handlePaymentInitiation = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await initiateEsewaPayment({
                bookingData,
            });

            if (!response.success) {
                const errorMessage = response.message || "Failed to initiate payment";
                setError(errorMessage);
                onError?.(errorMessage);
                return;
            }

            const { data } = response;
            const { transactionUuid, formData, formUrl } = data;

            // Store transaction UUID for later verification
            sessionStorage.setItem("currentPaymentTransaction", transactionUuid);
            onPaymentInitiated?.(transactionUuid);

            // Dynamically create and submit form to eSewa
            // Use a slightly delayed submission to ensure DOM is ready
            setTimeout(() => {
                if (formRef.current) {
                    // Clear any existing inputs
                    formRef.current.innerHTML = "";

                    // Create hidden form fields from response
                    Object.entries(formData).forEach(([key, value]) => {
                        const input = document.createElement("input");
                        input.type = "hidden";
                        input.name = key;
                        input.value = String(value);
                        formRef.current?.appendChild(input);
                    });

                    // Set form action and submit
                    formRef.current.action = formUrl;
                    formRef.current.method = "POST";
                    formRef.current.submit();
                }
            }, 100);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "An unexpected error occurred";
            setError(errorMessage);
            onError?.(errorMessage);
            console.error("Payment initiation error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Payment Information */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg">Payment Information</h3>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Rental Period:</span>
                        <span className="font-medium">{bookingData.totalDays} day(s)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Rate per Day:</span>
                        <span className="font-medium">Rs. {bookingData.pricePerDay}</span>
                    </div>
                    <div className="border-t border-blue-200 dark:border-blue-800 pt-2 flex justify-between font-semibold text-lg">
                        <span>Total Amount:</span>
                        <span className="text-blue-600 dark:text-blue-400">
                            Rs. {bookingData.totalAmount.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* eSewa Information */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                    <span className="text-lg">💳</span>
                    <span className="ml-2">eSewa Payment Gateway</span>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    You will be redirected to eSewa to complete the payment securely.
                </p>

                {/* Security Notice */}
                <div className="flex items-start gap-2 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                    <span className="text-green-600 text-lg flex-shrink-0">🔒</span>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        Your payment information is secure and encrypted. You will complete payment on eSewa's secure servers.
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert className="bg-red-50 dark:bg-red-950 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-600 dark:text-red-400">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* Payment Terms */}
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p>✓ Your booking will be confirmed once payment is successful.</p>
                <p>✓ You will receive a confirmation email with booking details.</p>
                <p>✓ The vehicle will be reserved until the specified dates.</p>
            </div>

            {/* Hidden Form for eSewa Submission */}
            <form ref={formRef} style={{ display: "none" }} />

            {/* Payment Button */}
            <Button
                onClick={handlePaymentInitiation}
                disabled={isLoading}
                className="w-full py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700"
            >
                {isLoading ? (
                    <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Preparing Payment...
                    </>
                ) : (
                    <>
                        <span className="mr-2">💳</span>
                        Pay Rs. {bookingData.totalAmount.toFixed(2)} via eSewa
                    </>
                )}
            </Button>

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 text-center">
                By proceeding, you agree to our terms and conditions. Payment is secured by eSewa.
            </p>
        </div>
    );
};

export default PaymentForm;
