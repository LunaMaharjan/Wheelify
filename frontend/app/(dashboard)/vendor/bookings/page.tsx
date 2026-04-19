"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Loader2,
    Calendar,
    DollarSign,
    MapPin,
    Camera,
    Upload,
    Sparkles,
    Eye,
} from "lucide-react";
import { getVendorBookings, compareBookingCondition } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { PreRentalImageUpload } from "@/components/booking/PreRentalImageUpload";
import { VendorPostRentalImageUpload } from "@/components/booking/VendorPostRentalImageUpload";
import Image from "next/image";
import { ImageModal } from "@/components/ui/image-modal";

interface DamageItem {
    area: string;
    severity: "none" | "low" | "medium" | "high" | string;
    description: string;
}

interface ConditionComparison {
    overallAssessment: string;
    damageSummary?: DamageItem[];
    recommendedActions?: string;
    isSafeToRentAgain?: boolean | null;
    notesForVendor?: string;
}

interface Booking {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        contact?: string;
    };
    vehicleId: {
        _id: string;
        name: string;
        category?: string;
        mainImage?: string;
        pricePerDay: number;
        type?: string;
    };
    startDate: string;
    endDate: string;
    totalDays: number;
    totalAmount: number;
    pricePerDay: number;
    bookingStatus: "pending" | "confirmed" | "active" | "completed" | "cancelled";
    paymentStatus: "pending" | "paid" | "refunded";
    pickupLocation?: {
        address: string;
        city: string;
    };
    createdAt: string;
    preRentalImages?: string[];
    preRentalImagesUploadedAt?: string;
    vendorPostRentalImages?: string[];
    vendorPostRentalImagesUploadedAt?: string;
    conditionComparisonSummary?: string;
    conditionComparisonJson?: ConditionComparison;
    conditionComparisonUpdatedAt?: string;
}

export default function VendorBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [uploadType, setUploadType] = useState<"pre" | "post" | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [isComparisonDialogOpen, setIsComparisonDialogOpen] = useState(false);
    const [comparisonResult, setComparisonResult] = useState<ConditionComparison | null>(null);
    const [comparisonError, setComparisonError] = useState<string | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [conditionPhotosDialog, setConditionPhotosDialog] = useState<{
        title: string;
        urls: string[];
        uploadedAt?: string;
    } | null>(null);

    const getOverallAssessmentText = (result: ConditionComparison | null) => {
        if (!result || !result.overallAssessment) {
            return "";
        }

        const value = result.overallAssessment;
        if (typeof value !== "string") {
            return String(value);
        }

        const trimmed = value.trim();

        // Handle cases where the model double-encodes JSON into the overallAssessment field
        // e.g. "{ \"overallAssessment\": \"The subject has ...\", ... }"
        if (trimmed.startsWith("{") && trimmed.includes("\"overallAssessment\"")) {
            const match = trimmed.match(/"overallAssessment"\s*:\s*"(.*)"/);
            if (match && match[1]) {
                return match[1].replace(/\\"/g, "\"");
            }
        }

        return value;
    };

    useEffect(() => {
        const fetchBookings = async () => {
            setIsLoading(true);
            try {
                const response = await getVendorBookings();
                if (response?.success && response?.data) {
                    setBookings(response.data);
                    setFilteredBookings(response.data);
                } else {
                    setBookings([]);
                    setFilteredBookings([]);
                }
            } catch (error: any) {
                console.error("Failed to fetch vendor bookings:", error);
                toast.error("Failed to fetch bookings", {
                    description: error.response?.data?.message || "An error occurred while fetching bookings",
                });
                setBookings([]);
                setFilteredBookings([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookings();
    }, []);

    useEffect(() => {
        let filtered = bookings;

        // Filter by tab
        if (activeTab !== "all") {
            filtered = filtered.filter((booking) => booking.bookingStatus === activeTab);
        }

        // Filter by search query
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (booking) =>
                    booking.userId.name.toLowerCase().includes(query) ||
                    booking.userId.email.toLowerCase().includes(query) ||
                    booking.vehicleId.name.toLowerCase().includes(query) ||
                    booking._id.toLowerCase().includes(query)
            );
        }

        setFilteredBookings(filtered);
    }, [searchQuery, bookings, activeTab]);

    const getBookingStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            pending: "secondary",
            confirmed: "default",
            active: "default",
            completed: "outline",
            cancelled: "destructive",
        };

        return (
            <Badge variant={variants[status] || "outline"} className="capitalize">
                {status}
            </Badge>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            pending: "secondary",
            paid: "default",
            refunded: "outline",
        };

        return (
            <Badge variant={variants[status] || "outline"} className="capitalize">
                {status}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "MMM dd, yyyy");
    };

    const formatDateTime = (dateString: string) => {
        return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    };

    const canUploadPreRental = (booking: Booking) => {
        return (
            booking.bookingStatus === "confirmed" &&
            (!booking.preRentalImages || booking.preRentalImages.length === 0)
        );
    };

    const canUploadPostRental = (booking: Booking) => {
        return (
            booking.bookingStatus !== "cancelled" &&
            new Date() > new Date(booking.endDate) &&
            (!booking.vendorPostRentalImages || booking.vendorPostRentalImages.length === 0)
        );
    };

    const canCompareCondition = (booking: Booking) => {
        return (
            !!booking.preRentalImages?.length &&
            !!booking.vendorPostRentalImages?.length
        );
    };

    const handleUploadSuccess = () => {
        setSelectedBooking(null);
        setUploadType(null);
        const refetch = async () => {
            try {
                const response = await getVendorBookings();
                if (response?.success && response?.data) {
                    setBookings(response.data);
                    setFilteredBookings(response.data);
                }
            } catch (e) {
                console.error("Failed to refetch bookings:", e);
            }
        };
        refetch();
    };

    const handleCompareClick = async (booking: Booking) => {
        try {
            setSelectedBooking(booking);
            setIsComparing(true);
            setComparisonResult(null);
            setComparisonError(null);
            setIsComparisonDialogOpen(true);

            const response = await compareBookingCondition(booking._id);
            if (response?.success && response?.data) {
                const summary =
                    response.data.comparison?.overallAssessment ||
                    response.data.summary ||
                    "Comparison completed.";
                const data = response.data.comparison as ConditionComparison;
                setComparisonResult(data);
                setBookings((prev) =>
                    prev.map((b) =>
                        b._id === booking._id
                            ? {
                                ...b,
                                conditionComparisonSummary: summary,
                                conditionComparisonJson: data,
                                conditionComparisonUpdatedAt:
                                    response.data.updatedAt,
                            }
                            : b
                    )
                );
                setFilteredBookings((prev) =>
                    prev.map((b) =>
                        b._id === booking._id
                            ? {
                                ...b,
                                conditionComparisonSummary: summary,
                                conditionComparisonJson: data,
                                conditionComparisonUpdatedAt:
                                    response.data.updatedAt,
                            }
                            : b
                    )
                );
            } else {
                setComparisonError(
                    response?.message || "Failed to compare condition."
                );
            }
        } catch (error: unknown) {
            const msg =
                error && typeof error === "object" && "response" in error
                    ? (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message
                    : error instanceof Error
                        ? error.message
                        : "Failed to compare condition.";
            setComparisonError(String(msg));
        } finally {
            setIsComparing(false);
        }
    };

    const handleViewComparisonClick = (booking: Booking) => {
        setSelectedBooking(booking);
        const existing = booking.conditionComparisonJson;
        if (existing) {
            setComparisonResult(existing);
            setComparisonError(null);
        } else {
            setComparisonResult(null);
            setComparisonError("No comparison data available.");
        }
        setIsComparing(false);
        setIsComparisonDialogOpen(true);
    };

    const statusCounts = {
        all: bookings.length,
        pending: bookings.filter((b) => b.bookingStatus === "pending").length,
        confirmed: bookings.filter((b) => b.bookingStatus === "confirmed").length,
        active: bookings.filter((b) => b.bookingStatus === "active").length,
        completed: bookings.filter((b) => b.bookingStatus === "completed").length,
        cancelled: bookings.filter((b) => b.bookingStatus === "cancelled").length,
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">My Bookings</h2>
                <p className="text-muted-foreground">
                    View and manage bookings for your vehicles
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Bookings</CardTitle>
                            <CardDescription>
                                A comprehensive list of all bookings for your vehicles
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search bookings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-6">
                            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
                            <TabsTrigger value="confirmed">Confirmed ({statusCounts.confirmed})</TabsTrigger>
                            <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
                            <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
                            <TabsTrigger value="cancelled">Cancelled ({statusCounts.cancelled})</TabsTrigger>
                        </TabsList>
                        <TabsContent value={activeTab} className="mt-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : filteredBookings.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    {searchQuery
                                        ? "No bookings found matching your search"
                                        : activeTab === "all"
                                            ? "No bookings found"
                                            : `No ${activeTab} bookings found`}
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Booking ID</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Vehicle</TableHead>
                                                <TableHead>Rental Period</TableHead>
                                                <TableHead>Pickup Location</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Booking Status</TableHead>
                                                <TableHead>Payment Status</TableHead>
                                                <TableHead>Condition photos</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredBookings.map((booking) => (
                                                <TableRow key={booking._id}>
                                                    <TableCell className="font-mono text-xs">
                                                        {booking._id.slice(-8)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{booking.userId.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {booking.userId.email}
                                                            </span>
                                                            {booking.userId.contact && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {booking.userId.contact}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{booking.vehicleId.name}</span>
                                                            <span className="text-xs text-muted-foreground capitalize">
                                                                {booking.vehicleId.category || "N/A"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                                <span>{formatDate(booking.startDate)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                                <span>{formatDate(booking.endDate)}</span>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {booking.totalDays} day{booking.totalDays !== 1 ? "s" : ""}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {booking.pickupLocation ? (
                                                            <div className="flex items-start gap-1">
                                                                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm">{booking.pickupLocation.address}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {booking.pickupLocation.city}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">
                                                                Rs. {booking.totalAmount.toLocaleString("en-US", {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            Rs. {booking.pricePerDay.toLocaleString("en-US", {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}{" "}
                                                            / day
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getBookingStatusBadge(booking.bookingStatus)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getPaymentStatusBadge(booking.paymentStatus)}
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <div className="flex flex-col gap-1.5 py-1">
                                                            {booking.preRentalImages &&
                                                            booking.preRentalImages.length > 0 ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="w-full justify-start"
                                                                    onClick={() =>
                                                                        setConditionPhotosDialog({
                                                                            title: "Before rental",
                                                                            urls: booking.preRentalImages!,
                                                                            uploadedAt:
                                                                                booking.preRentalImagesUploadedAt,
                                                                        })
                                                                    }
                                                                >
                                                                    <Camera className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                                                                    Before
                                                                </Button>
                                                            ) : null}
                                                            {booking.vendorPostRentalImages &&
                                                            booking.vendorPostRentalImages.length > 0 ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="w-full justify-start"
                                                                    onClick={() =>
                                                                        setConditionPhotosDialog({
                                                                            title: "After rental (vendor)",
                                                                            urls: booking.vendorPostRentalImages!,
                                                                            uploadedAt:
                                                                                booking.vendorPostRentalImagesUploadedAt,
                                                                        })
                                                                    }
                                                                >
                                                                    <Camera className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                                                                    After
                                                                </Button>
                                                            ) : null}
                                                            {(!booking.preRentalImages ||
                                                                booking.preRentalImages.length === 0) &&
                                                                (!booking.vendorPostRentalImages ||
                                                                    booking.vendorPostRentalImages.length === 0) && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    —
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {formatDateTime(booking.createdAt)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-2">
                                                            {canUploadPreRental(booking) ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedBooking(booking);
                                                                        setUploadType("pre");
                                                                    }}
                                                                >
                                                                    <Upload className="h-3 w-3 mr-1" />
                                                                    Before
                                                                </Button>
                                                            ) : booking.preRentalImages?.length ? (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Before ✓
                                                                </Badge>
                                                            ) : null}
                                                            {canUploadPostRental(booking) ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedBooking(booking);
                                                                        setUploadType("post");
                                                                    }}
                                                                >
                                                                    <Camera className="h-3 w-3 mr-1" />
                                                                    After
                                                                </Button>
                                                            ) : booking.vendorPostRentalImages?.length ? (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    After ✓
                                                                </Badge>
                                                            ) : null}
                                                            {canCompareCondition(booking) && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleCompareClick(booking)}
                                                                    disabled={
                                                                        isComparing &&
                                                                        selectedBooking?._id === booking._id
                                                                    }
                                                                >
                                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                                    {isComparing &&
                                                                        selectedBooking?._id === booking._id
                                                                        ? "Comparing..."
                                                                        : booking.conditionComparisonJson
                                                                            ? "Compare again"
                                                                            : "Compare"}
                                                                </Button>
                                                            )}
                                                            {booking.conditionComparisonJson && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleViewComparisonClick(booking)
                                                                    }
                                                                >
                                                                    <Eye className="h-3 w-3 mr-1" />
                                                                    View comparison
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {selectedBooking && uploadType === "pre" && (
                <PreRentalImageUpload
                    booking={selectedBooking}
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedBooking(null);
                            setUploadType(null);
                        }
                    }}
                    onSuccess={handleUploadSuccess}
                />
            )}

            {selectedBooking && uploadType === "post" && (
                <VendorPostRentalImageUpload
                    booking={selectedBooking}
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedBooking(null);
                            setUploadType(null);
                        }
                    }}
                    onSuccess={handleUploadSuccess}
                />
            )}

            <Dialog
                open={isComparisonDialogOpen}
                onOpenChange={setIsComparisonDialogOpen}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedBooking
                                ? `Condition comparison — ${selectedBooking.vehicleId.name}`
                                : "Condition comparison"}
                        </DialogTitle>
                        <DialogDescription>
                            AI comparison of before vs after rental photos (Gemini).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 max-h-[400px] overflow-auto rounded-md bg-muted p-4 space-y-4 text-sm">
                        {isComparing && !comparisonResult && !comparisonError && (
                            <p>Comparing photos…</p>
                        )}

                        {!isComparing && comparisonError && (
                            <p className="text-red-600 dark:text-red-400">
                                {comparisonError}
                            </p>
                        )}

                        {!isComparing && comparisonResult && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <h4 className="font-semibold">
                                            Overall assessment
                                        </h4>
                                        <p className="mt-1 text-muted-foreground whitespace-pre-line">
                                            {getOverallAssessmentText(comparisonResult)}
                                        </p>
                                    </div>
                                    {typeof comparisonResult.isSafeToRentAgain === "boolean" && (
                                        <Badge
                                            variant={
                                                comparisonResult.isSafeToRentAgain
                                                    ? "default"
                                                    : "destructive"
                                            }
                                        >
                                            {comparisonResult.isSafeToRentAgain
                                                ? "Safe to rent again"
                                                : "Not safe to rent"}
                                        </Badge>
                                    )}
                                </div>

                                {comparisonResult.damageSummary &&
                                    comparisonResult.damageSummary.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-2">
                                                Detected damage
                                            </h4>
                                            <div className="space-y-2">
                                                {comparisonResult.damageSummary.map(
                                                    (item, index) => (
                                                        <div
                                                            key={`${item.area}-${index}`}
                                                            className="rounded-md border bg-background p-3"
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-medium">
                                                                    {item.area}
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        item.severity === "high"
                                                                            ? "border-red-500 text-red-600"
                                                                            : item.severity === "medium"
                                                                                ? "border-orange-500 text-orange-600"
                                                                                : item.severity === "low"
                                                                                    ? "border-yellow-500 text-yellow-700"
                                                                                    : "border-gray-400 text-gray-600"
                                                                    }
                                                                >
                                                                    {item.severity}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-muted-foreground text-sm">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {comparisonResult.recommendedActions && (
                                    <div>
                                        <h4 className="font-semibold mb-1">
                                            Recommended actions
                                        </h4>
                                        <p className="text-muted-foreground whitespace-pre-line">
                                            {comparisonResult.recommendedActions}
                                        </p>
                                    </div>
                                )}

                                {comparisonResult.notesForVendor && (
                                    <div>
                                        <h4 className="font-semibold mb-1">
                                            Notes for vendor
                                        </h4>
                                        <p className="text-muted-foreground whitespace-pre-line">
                                            {comparisonResult.notesForVendor}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isComparing && !comparisonResult && !comparisonError && (
                            <p>No comparison data. Try again later.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!conditionPhotosDialog}
                onOpenChange={(open) => {
                    if (!open) setConditionPhotosDialog(null);
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {conditionPhotosDialog?.title ?? "Photos"}
                        </DialogTitle>
                        {conditionPhotosDialog?.uploadedAt && (
                            <DialogDescription>
                                Uploaded{" "}
                                {formatDateTime(conditionPhotosDialog.uploadedAt)}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 max-h-[min(70vh,520px)] overflow-y-auto pr-1">
                        {conditionPhotosDialog?.urls.map((url, idx) => (
                            <button
                                key={`${url}-${idx}`}
                                type="button"
                                onClick={() => setPreviewImageUrl(url)}
                                className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <Image
                                    src={url}
                                    alt={`${conditionPhotosDialog.title} ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, 200px"
                                />
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <ImageModal
                isOpen={!!previewImageUrl}
                imageSrc={previewImageUrl}
                onClose={() => setPreviewImageUrl(null)}
                alt="Booking condition photo"
            />
        </div>
    );
}

