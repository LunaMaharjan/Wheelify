"use client";

import React, { useState, useEffect } from "react";
import { format, addDays, isAfter } from "date-fns";
import { Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkAvailability } from "@/lib/api";

interface Vehicle {
    _id: string;
    name: string;
    type: string;
    pricePerDay: number;
    pickupLocation?: {
        address: string;
        city: string;
    };
}

interface BookingFormProps {
    vehicle: Vehicle;
    onSubmit: (data: {
        startDate: string;
        endDate: string;
        totalDays: number;
        totalAmount: number;
    }) => Promise<void>;
    isLoading?: boolean;
}

const BookingForm = ({
    vehicle,
    onSubmit,
    isLoading = false,
}) => {
    const today = new Date();
    const minDate = format(addDays(today, 1), "yyyy-MM-dd");
    const maxDate = format(addDays(today, 365), "yyyy-MM-dd");

    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [availability, setAvailability] = useState<boolean | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [totalDays, setTotalDays] = useState<number>(0);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const SECURITY_DEPOSIT = 5000; // fixed refundable security deposit

    // Calculate total days and amount when dates change
    useEffect(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isAfter(end, start)) {
                const days = Math.ceil(
                    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                );
                setTotalDays(days);
                // include refundable security deposit in final amount
                setTotalAmount(days * vehicle.pricePerDay + SECURITY_DEPOSIT);
            } else {
                setTotalDays(0);
                setTotalAmount(0);
            }
        }
    }, [startDate, endDate, vehicle.pricePerDay]);

    // Check availability when dates are selected
    useEffect(() => {
        if (startDate && endDate && totalDays > 0) {
            checkAvailabilityHandler();
        }
    }, [startDate, endDate, totalDays]);

    const checkAvailabilityHandler = async () => {
        try {
            setCheckingAvailability(true);
            const response = await checkAvailability({
                vehicleId: vehicle._id,
                startDate,
                endDate,
            });
            console.log('Availability response:', response);
            setAvailability(response.success && response.available);
        } catch (error) {
            console.error("Availability check failed:", error);
            setAvailability(false);
        } finally {
            setCheckingAvailability(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!startDate) {
            newErrors.startDate = "Start date is required";
        }

        if (!endDate) {
            newErrors.endDate = "End date is required";
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (!isAfter(end, start)) {
                newErrors.endDate = "End date must be after start date";
            }

            if (start < today) {
                newErrors.startDate = "Start date cannot be in the past";
            }
        }

        if (availability === false) {
            newErrors.availability = "Vehicle is not available for selected dates";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit({
                startDate,
                endDate,
                totalDays,
                totalAmount,
            });
        } catch (error) {
            console.error("Booking submission error:", error);
            setErrors({
                submit: error instanceof Error ? error.message : "Failed to submit booking",
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Information */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{vehicle.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type: <span className="font-medium capitalize">{vehicle.type}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rate: <span className="font-medium">Rs. {vehicle.pricePerDay}/day</span>
                </p>
                {vehicle.pickupLocation && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pickup: <span className="font-medium">
                            {vehicle.pickupLocation.address}, {vehicle.pickupLocation.city}
                        </span>
                    </p>
                )}
            </div>

            {/* Date Selection */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            <Calendar className="inline w-4 h-4 mr-2" />
                            Start Date
                        </label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setErrors({ ...errors, startDate: "" });
                            }}
                            min={minDate}
                            max={maxDate}
                            disabled={isLoading}
                            className={errors.startDate ? "border-red-500" : ""}
                        />
                        {errors.startDate && (
                            <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            <Calendar className="inline w-4 h-4 mr-2" />
                            End Date
                        </label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setErrors({ ...errors, endDate: "" });
                            }}
                            min={startDate || minDate}
                            max={maxDate}
                            disabled={!startDate || isLoading}
                            className={errors.endDate ? "border-red-500" : ""}
                        />
                        {errors.endDate && (
                            <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                        )}
                    </div>
                </div>

                {/* Availability Status */}
                {startDate && endDate && totalDays > 0 && (
                    <div>
                        {checkingAvailability ? (
                            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-600">
                                    Checking availability...
                                </AlertDescription>
                            </Alert>
                        ) : availability ? (
                            <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                                <AlertDescription className="text-green-600 dark:text-green-400">
                                    ✓ Vehicle is available for {totalDays} day{totalDays !== 1 ? "s" : ""}
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="bg-red-50 dark:bg-red-950 border-red-200">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-600 dark:text-red-400">
                                    This vehicle is not available for the selected dates
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </div>

            {/* Cost Breakdown */}
            {totalDays > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            {totalDays} day{totalDays !== 1 ? "s" : ""} × Rs. {vehicle.pricePerDay}/day
                        </span>
                        <span className="font-medium">Rs. {(totalDays * vehicle.pricePerDay).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Security deposit (refundable)</span>
                        <span className="font-medium">Rs. {SECURITY_DEPOSIT.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold text-lg">
                        <span>Total Amount</span>
                        <span className="text-blue-600 dark:text-blue-400">
                            Rs. {totalAmount.toFixed(2)}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        The security deposit of Rs. {SECURITY_DEPOSIT.toFixed(2)} is collected at the time of booking and will be refunded once the rental finishes and the vehicle is returned in the same condition.
                    </p>
                </div>
            )}

            {/* Error Alert */}
            {errors.availability || errors.submit ? (
                <Alert className="bg-red-50 dark:bg-red-950 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-600 dark:text-red-400">
                        {errors.availability || errors.submit}
                    </AlertDescription>
                </Alert>
            ) : null}

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={isLoading || !startDate || !endDate || availability === false}
                className="w-full py-6 text-base font-semibold"
            >
                {isLoading ? "Processing..." : "Continue to Payment"}
            </Button>
        </form>
    );
};

export default BookingForm;
