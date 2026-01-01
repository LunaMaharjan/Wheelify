"use client";

import React from "react";
import { format } from "date-fns";
import { MapPin, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface BookingDetails {
    startDate: string;
    endDate: string;
    totalDays: number;
    totalAmount: number;
}

interface BookingSummaryProps {
    vehicle: Vehicle;
    bookingDetails: BookingDetails;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({ vehicle, bookingDetails }) => {
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "MMM dd, yyyy");
    };

    const formatDateTime = (dateString: string) => {
        return format(new Date(dateString), "MMM dd, yyyy (EEEE)");
    };

    return (
        <div className="space-y-6">
            {/* Vehicle Card */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Vehicle Image */}
                {vehicle.images && vehicle.images.length > 0 && (
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        <img
                            src={vehicle.images[0]}
                            alt={vehicle.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Vehicle Details */}
                <div className="p-4 space-y-3">
                    <div>
                        <h3 className="text-xl font-bold">{vehicle.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            Type: {vehicle.type}
                        </p>
                    </div>

                    {vehicle.pickupLocation && (
                        <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium">Pickup Location</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {vehicle.pickupLocation.address}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {vehicle.pickupLocation.city}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Rental Period */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Rental Period
                </h4>

                <div className="space-y-2">
                    <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Start Date
                        </p>
                        <p className="font-medium text-lg">
                            {formatDateTime(bookingDetails.startDate)}
                        </p>
                    </div>

                    <div className="flex justify-center py-2">
                        <span className="text-2xl">→</span>
                    </div>

                    <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            End Date
                        </p>
                        <p className="font-medium text-lg">
                            {formatDateTime(bookingDetails.endDate)}
                        </p>
                    </div>

                    <div className="border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Duration: <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                                {bookingDetails.totalDays} day{bookingDetails.totalDays !== 1 ? "s" : ""}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold">Cost Breakdown</h4>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            Daily Rate × Duration
                        </span>
                        <span>
                            Rs. {vehicle.pricePerDay} × {bookingDetails.totalDays} days
                        </span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                        <span>Rs. {(vehicle.pricePerDay * bookingDetails.totalDays).toFixed(2)}</span>
                    </div>

                    {/* Tax/Services could be added here if needed */}
                    {/* <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Service Fee</span>
                        <span>Rs. 0.00</span>
                    </div> */}

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-bold text-lg">
                        <span>Total Amount</span>
                        <span className="text-blue-600 dark:text-blue-400">
                            Rs. {bookingDetails.totalAmount.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Important Note */}
            <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-600 dark:text-amber-400">
                    Please review all details carefully before proceeding to payment. Once payment is confirmed, your booking cannot be cancelled within 24 hours.
                </AlertDescription>
            </Alert>

            {/* Terms & Conditions Checkbox would be added here if needed */}
        </div>
    );
};

export default BookingSummary;
