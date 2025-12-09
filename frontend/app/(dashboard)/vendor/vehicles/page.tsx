"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Car, Plus } from "lucide-react";
import { getMyVehicles } from "@/lib/api";

interface Vehicle {
    _id: string;
    name: string;
    type: string;
    pricePerDay: number;
    status: string;
    images: string[];
    createdAt: string;
}

export default function VendorVehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
                <Button>
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
                        <Button>
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
                                    <div>
                                        <CardTitle>{vehicle.name}</CardTitle>
                                        <CardDescription className="capitalize">
                                            {vehicle.type}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(vehicle.status)}>
                                        {vehicle.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Price per day:
                                        </span>
                                        <span className="font-semibold">
                                            ${vehicle.pricePerDay}
                                        </span>
                                    </div>
                                    {vehicle.images && vehicle.images.length > 0 && (
                                        <div className="mt-4">
                                            <img
                                                src={vehicle.images[0]}
                                                alt={vehicle.name}
                                                className="w-full h-48 object-cover rounded-md"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

