import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Car, MapPin, DollarSign, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VehicleCardProps {
    vehicle: {
        _id: string;
        name: string;
        type: string;
        description?: string;
        images: string[];
        pricePerDay: number;
        status: string;
        location: string;
        condition: string;
        vendorId?: {
            _id: string;
            name: string;
            email: string;
            contact?: string;
        };
        createdAt?: string;
    };
    className?: string;
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

const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case "car":
            return "🚗";
        case "bike":
            return "🏍️";
        case "scooter":
            return "🛵";
        default:
            return "🚙";
    }
};

const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatCondition = (condition: string) => {
    return condition.charAt(0).toUpperCase() + condition.slice(1);
};

export function VehicleCard({ vehicle, className }: VehicleCardProps) {
    const hasImages = vehicle.images && vehicle.images.length > 0;
    const statusVariant = getStatusVariant(vehicle.status);
    const typeIcon = getTypeIcon(vehicle.type);

    return (
        <Card
            className={cn(
                "group overflow-hidden pt-0 transition-all duration-300",
                "border-border/50 hover:border-border",
                className
            )}
        >
            <Link href={`/rent/${vehicle._id}`} className="block">
                {/* Image Section */}
                <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                    {hasImages ? (
                        <>
                            <Image
                                src={vehicle.images[0]}
                                alt={vehicle.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted via-muted/80 to-muted/60">
                            <div className="text-center">
                                <Car className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-xs text-muted-foreground/70">No image available</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Type Badge - Top Right */}
                    <div className="absolute top-3 right-3 z-10">
                        <Badge 
                            variant="secondary" 
                            className="backdrop-blur-sm bg-background/80 border border-border/50 shadow-lg"
                        >
                            <span className="mr-1.5 text-base">{typeIcon}</span>
                            {formatType(vehicle.type)}
                        </Badge>
                    </div>

                    {/* Status Badge - Top Left */}
                    <div className="absolute top-3 left-3 z-10">
                        <Badge 
                            variant={statusVariant}
                            className={cn(
                                "backdrop-blur-sm shadow-lg",
                                statusVariant === "default" && "bg-green-500/90 text-white border-green-600/50",
                                statusVariant === "secondary" && "bg-blue-500/90 text-white border-blue-600/50",
                                statusVariant === "destructive" && "bg-red-500/90 text-white border-red-600/50"
                            )}
                        >
                            {vehicle.status === "available" && "✓ "}
                            {formatCondition(vehicle.status)}
                        </Badge>
                    </div>

                    {/* Image Count Indicator */}
                    {hasImages && vehicle.images.length > 1 && (
                        <div className="absolute bottom-3 right-3 z-10">
                            <Badge variant="secondary" className="backdrop-blur-sm bg-background/80 border border-border/50 text-xs">
                                {vehicle.images.length} {vehicle.images.length === 1 ? "photo" : "photos"}
                            </Badge>
                        </div>
                    )}
                </div>

                <Separator className="opacity-50" />

                {/* Content Section */}
                <CardHeader className="pb-3">
                    <div className="space-y-2">
                        <CardTitle className="line-clamp-1 text-xl font-bold group-hover:text-primary transition-colors">
                            {vehicle.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-sm min-h-[2.5rem]">
                            {vehicle.description || "No description available"}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                    {/* Price Section */}
                    <div className="flex items-baseline gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-2xl font-bold text-foreground">
                                Rs. {vehicle.pricePerDay.toLocaleString()}
                            </span>
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">/day</span>
                    </div>

                    {/* Location Section */}
                    {vehicle.location && (
                        <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground line-clamp-1">{vehicle.location}</span>
                        </div>
                    )}

                    {/* Footer Section */}
                    <div className="flex items-center justify-between pt-2 border-t">
                        <Badge 
                            variant="outline" 
                            className="text-xs font-medium capitalize"
                        >
                            <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                            {formatCondition(vehicle.condition)}
                        </Badge>
                        
                        {vehicle.vendorId && (
                            <div className="text-xs text-muted-foreground">
                                by <span className="font-medium text-foreground">{vehicle.vendorId.name}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}

