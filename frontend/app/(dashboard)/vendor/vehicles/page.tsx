"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Car, Plus, Clock, CheckCircle, XCircle, Edit } from "lucide-react";
import { getMyVehicles } from "@/lib/api";
import { VehicleUploadForm } from "@/components/vendor/VehicleUploadForm";

interface Vehicle {
    _id: string;
    name: string;
    type: string;
    pricePerDay: number;
    status: string;
    images: string[];
    approvalStatus?: "pending" | "approved" | "rejected";
    rejectionMessage?: string;
    condition: string;
    description?: string;
    location?: string;
    bluebook?: string;
    createdAt: string;
}

export default function VendorVehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    const fetchVehicles = async () => {
        setIsLoading(true);
        try {
            const response = await getMyVehicles();
            if (response?.success && response?.vehicles) {
                setVehicles(response.vehicles);
            }
        } catch (error) {
            console.error("Failed to fetch vehicles:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "available":
                return "default";
            case "rented":
                return "secondary";
            case "maintenance":
                return "destructive";
            default:
                return "outline";
        }
    };

    const getApprovalStatusBadge = (approvalStatus?: string) => {
        switch (approvalStatus) {
            case "approved":
                return (
                    <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Approved
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Rejected
                    </Badge>
                );
            case "pending":
            default:
                return (
                    <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading vehicles...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Vehicles</h2>
                    <p className="text-muted-foreground">
                        Manage your vehicle inventory
                    </p>
                </div>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vehicle
                </Button>
            </div>

            {vehicles.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Car className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No vehicles yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Start by adding your first vehicle to the inventory.
                        </p>
                        <Button onClick={() => setIsUploadDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Vehicle
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vehicles.map((vehicle) => (
                        <Card key={vehicle._id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle>{vehicle.name}</CardTitle>
                                        <CardDescription className="capitalize">
                                            {vehicle.type}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        {getApprovalStatusBadge(vehicle.approvalStatus)}
                                        <Badge variant={getStatusBadgeVariant(vehicle.status)} className="text-xs">
                                            {vehicle.status}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Price per day:
                                        </span>
                                        <span className="font-semibold">
                                            Rs. {vehicle.pricePerDay}
                                        </span>
                                    </div>
                                    {vehicle.condition && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Condition:
                                            </span>
                                            <span className="text-sm capitalize">
                                                {vehicle.condition}
                                            </span>
                                        </div>
                                    )}
                                    {vehicle.approvalStatus === "rejected" && vehicle.rejectionMessage && (
                                        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                                            <p className="text-xs font-semibold text-destructive mb-1">
                                                Rejection Reason:
                                            </p>
                                            <p className="text-xs text-destructive">
                                                {vehicle.rejectionMessage}
                                            </p>
                                        </div>
                                    )}
                                    {vehicle.images && vehicle.images.length > 0 && (
                                        <div className="mt-4">
                                            <img
                                                src={vehicle.images[0]}
                                                alt={vehicle.name}
                                                className="w-full h-48 object-cover rounded-md"
                                            />
                                        </div>
                                    )}
                                    {vehicle.approvalStatus === "rejected" && (
                                        <div className="mt-4 pt-4 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => {
                                                    setEditingVehicle(vehicle);
                                                    setIsUploadDialogOpen(true);
                                                }}
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit & Resubmit
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            <VehicleUploadForm
                open={isUploadDialogOpen}
                onOpenChange={(open) => {
                    setIsUploadDialogOpen(open);
                    if (!open) {
                        setEditingVehicle(null);
                    }
                }}
                onSuccess={() => {
                    fetchVehicles();
                    setEditingVehicle(null);
                }}
                vehicle={editingVehicle || null}
            />
        </div>
    );
}

