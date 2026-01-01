"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    Car,
    MapPin,
    Star,
    Calendar,
    User,
    Mail,
    Phone,
    ArrowLeft,
    Loader2,
    CheckCircle,
    AlertCircle,
    Wrench,
    FileText,
} from "lucide-react";
import { getVehicleById } from "@/lib/api";
import { toast } from "sonner";
import { ImageModal } from "@/components/ui/image-modal";
import { useAuthGuard } from "@/hooks/use-auth-guard";

interface Vehicle {
    _id: string;
    name: string;
    type: string;
    description?: string;
    images: string[];
    pricePerDay: number;
    status: string;
    location: string;
    condition: string;
    specifications?: Record<string, string>;
    bluebook?: string;
    vendorId: {
        _id: string;
        name: string;
        email: string;
        contact?: string;
        address?: string;
    };
    createdAt?: string;
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
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

const getStatusIcon = (status: string) => {
    switch (status) {
        case "available":
            return <CheckCircle className="h-4 w-4" />;
        case "rented":
            return <Calendar className="h-4 w-4" />;
        case "maintenance":
            return <Wrench className="h-4 w-4" />;
        default:
            return <AlertCircle className="h-4 w-4" />;
    }
};

const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatCondition = (condition: string) => {
    return condition.charAt(0).toUpperCase() + condition.slice(1);
};

export default function VehicleDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const vehicleId = params?.id as string;

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isBooking, setIsBooking] = useState(false);
    const { isAuthenticated, isLoading: authLoading } = useAuthGuard();

    useEffect(() => {
        if (vehicleId) {
            fetchVehicle();
        }
    }, [vehicleId]);

    const fetchVehicle = async () => {
        setIsLoading(true);
        try {
            const response = await getVehicleById(vehicleId);
            if (response?.success && response?.vehicle) {
                setVehicle(response.vehicle);
            } else {
                toast.error("Vehicle not found");
                router.push("/rent");
            }
        } catch (error: any) {
            console.error("Failed to fetch vehicle:", error);
            if (error?.response?.status === 404) {
                toast.error("Vehicle not found");
            } else {
                toast.error("Failed to load vehicle details");
            }
            router.push("/rent");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBookNow = () => {
        // Check if user is authenticated
        if (!isAuthenticated && !authLoading) {
            toast.error("Please login to book a vehicle");
            router.push(`/login?next=/rent/${vehicleId}`);
            return;
        }

        // Check if vehicle is available
        if (vehicle?.status !== "available") {
            toast.error("This vehicle is not available for booking");
            return;
        }

        // Navigate to booking page (to be created)
        router.push(`/rent/book/?vehicleId=${vehicleId}`);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground">Loading vehicle details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!vehicle) {
        return null;
    }

    const hasImages = vehicle.images && vehicle.images.length > 0;
    const statusVariant = getStatusVariant(vehicle.status);
    const statusIcon = getStatusIcon(vehicle.status);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-6"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Images */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Main Image Carousel */}
                    <Card className="overflow-hidden">
                        {hasImages ? (
                            <Carousel className="w-full">
                                <CarouselContent>
                                    {vehicle.images.map((image, index) => (
                                        <CarouselItem key={index}>
                                            <div className="relative h-[500px] w-full">
                                                <Image
                                                    src={image}
                                                    alt={`${vehicle.name} - Image ${index + 1}`}
                                                    fill
                                                    className="object-cover cursor-pointer"
                                                    sizes="(max-width: 1024px) 100vw, 66vw"
                                                    onClick={() => setSelectedImage(image)}
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {vehicle.images.length > 1 && (
                                    <>
                                        <CarouselPrevious className="left-4" />
                                        <CarouselNext className="right-4" />
                                    </>
                                )}
                            </Carousel>
                        ) : (
                            <div className="relative h-[500px] w-full bg-gradient-to-br from-muted via-muted/80 to-muted/60 flex items-center justify-center">
                                <div className="text-center">
                                    <Car className="h-24 w-24 mx-auto mb-4 text-muted-foreground/50" />
                                    <p className="text-muted-foreground">No images available</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Thumbnail Gallery */}
                    {hasImages && vehicle.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {vehicle.images.map((image, index) => (
                                <div
                                    key={index}
                                    className="relative h-24 w-full rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-colors"
                                    onClick={() => setSelectedImage(image)}
                                >
                                    <Image
                                        src={image}
                                        alt={`${vehicle.name} thumbnail ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 25vw, 16vw"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">
                                {vehicle.description || "No description available for this vehicle."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Specifications */}
                    {vehicle.specifications && Object.keys(vehicle.specifications).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Specifications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(vehicle.specifications).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center py-2 border-b last:border-0">
                                            <span className="text-muted-foreground capitalize">
                                                {key.replace(/([A-Z])/g, " $1").trim()}:
                                            </span>
                                            <span className="font-medium">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Details & Booking */}
                <div className="space-y-6">
                    {/* Vehicle Info Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-2xl mb-2">{vehicle.name}</CardTitle>
                                    <CardDescription className="text-base">
                                        {formatType(vehicle.type)}
                                    </CardDescription>
                                </div>
                                <Badge variant={statusVariant} className="gap-1.5">
                                    {statusIcon}
                                    {formatCondition(vehicle.status)}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Price */}
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-foreground">
                                    Rs. {vehicle.pricePerDay.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">/day</span>
                            </div>

                            <Separator />

                            {/* Location */}
                            {vehicle.location && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                                        <p className="text-foreground">{vehicle.location}</p>
                                    </div>
                                </div>
                            )}

                            {/* Condition */}
                            <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Condition</p>
                                    <p className="text-foreground capitalize">{vehicle.condition}</p>
                                </div>
                            </div>

                            <Separator />

                            {/* Book Now Button */}
                            <Button
                                size="lg"
                                className="w-full h-12 text-base font-semibold"
                                onClick={handleBookNow}
                                // disabled={vehicle.status !== "available" || isBooking}
                                disabled
                            >
                                {isBooking ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="mr-2 h-5 w-5" />
                                        Book Now
                                    </>
                                )}
                            </Button>

                            {vehicle.status !== "available" && (
                                <p className="text-sm text-muted-foreground text-center">
                                    This vehicle is currently {vehicle.status}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Vendor Info Card */}
                    {vehicle.vendorId && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Vendor Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                                    <p className="text-foreground font-medium">{vehicle.vendorId.name}</p>
                                </div>

                                {vehicle.vendorId.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={`mailto:${vehicle.vendorId.email}`}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {vehicle.vendorId.email}
                                        </a>
                                    </div>
                                )}

                                {vehicle.vendorId.contact && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={`tel:${vehicle.vendorId.contact}`}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {vehicle.vendorId.contact}
                                        </a>
                                    </div>
                                )}

                                {vehicle.vendorId.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-muted-foreground">{vehicle.vendorId.address}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Additional Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Vehicle Type</span>
                                <Badge variant="outline">{formatType(vehicle.type)}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Condition</span>
                                <Badge variant="outline" className="capitalize">
                                    <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                                    {vehicle.condition}
                                </Badge>
                            </div>
                            {vehicle.bluebook && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Bluebook</span>
                                    <Badge variant="outline" className="gap-1">
                                        <FileText className="h-3 w-3" />
                                        Available
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <ImageModal
                    isOpen={!!selectedImage}
                    imageSrc={selectedImage}
                    onClose={() => setSelectedImage(null)}
                    alt={vehicle.name}
                />
            )}
        </div>
    );
}

