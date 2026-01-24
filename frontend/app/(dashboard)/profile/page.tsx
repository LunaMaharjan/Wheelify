"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfile, uploadLicense, getUserBookings } from "@/lib/api";
import { 
    Car, 
    CheckCircle, 
    Clock, 
    CreditCard, 
    Loader2, 
    ShieldCheck, 
    Bell,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Edit,
    ChevronRight,
    TrendingUp,
    Home,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navigation";

type ProfileUser = {
    name: string;
    email: string;
    role: string;
    image?: string;
    contact?: string;
    address?: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    licenseImage?: string;
    licenseStatus?: "none" | "pending" | "approved" | "rejected";
    licenseReviewNote?: string;
    isAccountVerified: boolean;
};

type Rental = {
    id: string;
    vehicle: string;
    startDate: string;
    endDate?: string;
    amount: number;
    status: "current" | "past";
};

type Booking = {
    _id: string;
    vehicleId: {
        _id: string;
        name: string;
        category?: string;
        mainImage?: string;
        pricePerDay: number;
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
};

export default function ProfilePage() {
    const [user, setUser] = useState<ProfileUser | null>(null);
    const [rentals, setRentals] = useState<{ current: Rental[]; past: Rental[] }>({
        current: [],
        past: [],
    });
    const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
    const [rentalHistory, setRentalHistory] = useState<Booking[]>([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);
    const [totalSpend, setTotalSpend] = useState(0);
    const [preferences, setPreferences] = useState({
        alerts: true,
        recommendations: true,
        marketingEmails: false,
    });
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [licenseNumberInput, setLicenseNumberInput] = useState("");
    const [licenseExpiryInput, setLicenseExpiryInput] = useState("");
    const [isUploadingLicense, setIsUploadingLicense] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            setIsLoading(true);
            try {
                const response = await getProfile();
                if (!isMounted) return;

                if (response?.user) {
                    const fetchedUser = response.user;

                    if (fetchedUser.role !== "user") {
                        router.replace("/vendor");
                        return;
                    }

                    setUser(fetchedUser);

                    const parsedExpiry = fetchedUser.licenseExpiry
                        ? new Date(fetchedUser.licenseExpiry)
                        : null;
                    const expiryValue =
                        parsedExpiry && !isNaN(parsedExpiry.getTime())
                            ? parsedExpiry.toISOString().split("T")[0]
                            : "";

                    setLicenseNumberInput(fetchedUser.licenseNumber || "");
                    setLicenseExpiryInput(expiryValue);

                    const currentRentals = response?.rentals?.current || [];
                    const pastRentals = response?.rentals?.past || [];
                    setRentals({
                        current: currentRentals,
                        past: pastRentals,
                    });

                    // Total spend will be calculated from bookings data when fetched
                    const spendFromApi = response?.stats?.totalSpend;
                    if (typeof spendFromApi === "number") {
                        setTotalSpend(spendFromApi);
                    }
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const fetchBookings = async () => {
            setIsLoadingBookings(true);
            try {
                const response = await getUserBookings();
                if (response?.success && response?.data) {
                    // Get today's date in local timezone, normalized to midnight
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const todayTime = today.getTime();

                    // Separate active bookings and rental history based on end date
                    const active: Booking[] = [];
                    const history: Booking[] = [];

                    response.data.forEach((booking: Booking) => {
                        // Skip cancelled bookings
                        if (booking.bookingStatus === "cancelled") {
                            return;
                        }

                        // Parse end date string (could be ISO string or date string)
                        const endDateStr = booking.endDate;
                        const endDate = new Date(endDateStr);
                        
                        // Normalize to date only (remove time component) in local timezone
                        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                        const endDateTime = endDateOnly.getTime();

                        // If booking status is "completed", always add to history
                        if (booking.bookingStatus === "completed") {
                            history.push(booking);
                            return;
                        }

                        // Compare dates: if end date is before today, it's in history
                        // Using getTime() for reliable numeric comparison
                        if (endDateTime < todayTime) {
                            history.push(booking);
                        } else {
                            // End date is today or in the future - it's active
                            active.push(booking);
                        }
                    });

                    // Sort history by end date (most recent first)
                    history.sort((a, b) => {
                        const dateA = new Date(a.endDate).getTime();
                        const dateB = new Date(b.endDate).getTime();
                        return dateB - dateA;
                    });

                    // Sort active by start date (upcoming first)
                    active.sort((a, b) => {
                        const dateA = new Date(a.startDate).getTime();
                        const dateB = new Date(b.startDate).getTime();
                        return dateA - dateB;
                    });

                    console.log("Total bookings:", response.data.length);
                    console.log("Active bookings:", active.length);
                    console.log("Rental history:", history.length);
                    console.log("Today:", today.toISOString());
                    console.log("Sample booking end dates:", response.data.slice(0, 3).map((b: Booking) => ({
                        id: b._id.slice(-8),
                        endDate: b.endDate,
                        status: b.bookingStatus,
                        vehicle: b.vehicleId.name
                    })));

                    setActiveBookings(active);
                    setRentalHistory(history);

                    // Calculate total spend from all bookings
                    const totalSpendFromBookings = response.data.reduce(
                        (sum: number, booking: Booking) => {
                            if (booking.bookingStatus !== "cancelled" && booking.paymentStatus === "paid") {
                                return sum + (booking.totalAmount || 0);
                            }
                            return sum;
                        },
                        0
                    );
                    setTotalSpend(totalSpendFromBookings);
                }
            } catch (error) {
                console.error("Failed to fetch bookings:", error);
            } finally {
                setIsLoadingBookings(false);
            }
        };

        if (user && user.role === "user") {
            fetchBookings();
        }
    }, [user]);

    const formatCurrency = (value: number) =>
        `Rs. ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const formatDate = (date: string | undefined) => {
        if (!date) return "—";
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString();
    };

    const getLicenseStatusStyles = (status?: string) => {
        switch (status) {
            case "approved":
                return { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
            case "pending":
                return { label: "Pending review", className: "bg-amber-100 text-amber-800 border-amber-200" };
            case "rejected":
                return { label: "Rejected", className: "bg-rose-100 text-rose-700 border-rose-200" };
            default:
                return { label: "Not uploaded", className: "bg-slate-100 text-slate-700 border-slate-200" };
        }
    };

    const handleLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Only allow images
        if (!file.type.startsWith("image/")) {
            toast.error("Invalid file type. Only image files (JPEG, PNG, JPG) are allowed.");
            e.target.value = ''; // Clear the input
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            toast.error("File size must be under 15MB.");
            return;
        }

        setLicenseFile(file);
    };

    const handleLicenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!licenseFile) {
            toast.error("Please attach your license photo.");
            return;
        }

        if (!licenseNumberInput || !licenseNumberInput.trim()) {
            toast.error("License number is required.");
            return;
        }

        if (!licenseExpiryInput) {
            toast.error("License expiry date is required.");
            return;
        }

        setIsUploadingLicense(true);
        try {
            const formData = new FormData();
            formData.append("licenseImage", licenseFile);
            formData.append("licenseNumber", licenseNumberInput.trim());
            formData.append("licenseExpiry", licenseExpiryInput);

            const response = await uploadLicense(formData);

            if (response?.success && response?.user) {
                setUser(response.user);
                toast.success("License submitted for admin review.");
                setLicenseFile(null);
            } else {
                toast.error(response?.message || "Failed to upload license.");
            }
        } catch (error: any) {
            console.error("Upload license error:", error);
            toast.error(error.response?.data?.message || "Failed to upload license.");
        } finally {
            setIsUploadingLicense(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-slate-600" />
                    <p className="text-slate-600 font-medium">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const initials = user.name
        .split(" ")
        .map((chunk) => chunk.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Header Section */}
            <Navbar />
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-20 w-20 border-4 border-white shadow-xl ring-2 ring-slate-100">
                                {user.image ? (
                                    <AvatarImage src={user.image} alt={user.name} />
                                ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold">
                                        {initials || "U"}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
                                    {user.isAccountVerified && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Verified
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-slate-600 flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Profile
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Quick Stats */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-slate-600">Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Total Spent</p>
                                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpend)}</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Active Rentals</p>
                                        <p className="text-2xl font-bold text-slate-900">{activeBookings.length}</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                                        <Clock className="h-6 w-6 text-slate-600" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Rental History</p>
                                        <p className="text-2xl font-bold text-slate-900">{rentalHistory.length}</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-slate-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Info */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <Phone className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 mb-1">Phone</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {user.contact || "Not provided"}
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 mb-1">Address</p>
                                        <p className="text-sm font-medium text-slate-900 break-words">
                                            {user.address || "Not provided"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* License Info */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">License Details</CardTitle>
                                    <Badge
                                        variant="outline"
                                        className={`${getLicenseStatusStyles(user.licenseStatus).className} font-medium`}
                                    >
                                        {getLicenseStatusStyles(user.licenseStatus).label}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {user.licenseNumber && (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-2">License Number</p>
                                        <p className="text-sm font-mono font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            {user.licenseNumber}
                                        </p>
                                    </div>
                                )}
                                {user.licenseExpiry && (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-2">Expiry Date</p>
                                        <p className="text-sm font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-500" />
                                            {formatDate(user.licenseExpiry)}
                                        </p>
                                    </div>
                                )}
                                {user.licenseImage && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-500">Uploaded License</p>
                                        <img
                                            src={user.licenseImage}
                                            alt="License upload"
                                            className="w-full max-w-md rounded-lg border border-slate-200 shadow-sm"
                                        />
                                    </div>
                                )}
                                {!user.licenseNumber && !user.licenseExpiry && !user.licenseImage && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                        No license submitted yet. Upload your license to get verified.
                                    </div>
                                )}
                                {user.licenseReviewNote && user.licenseStatus === "rejected" && (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
                                        {user.licenseReviewNote}
                                    </div>
                                )}
                                {user.licenseStatus !== "approved" && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-slate-600" />
                                            <p className="text-sm text-slate-700">
                                                Upload your license photo to get verified by admin.
                                            </p>
                                        </div>
                                        <form className="space-y-3" onSubmit={handleLicenseSubmit}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="licenseNumber">
                                                        License Number <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="licenseNumber"
                                                        value={licenseNumberInput}
                                                        onChange={(e) => setLicenseNumberInput(e.target.value)}
                                                        placeholder="e.g. DL-1234-5678"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="licenseExpiry">
                                                        Expiry Date <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="licenseExpiry"
                                                        type="date"
                                                        value={licenseExpiryInput}
                                                        onChange={(e) => setLicenseExpiryInput(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="licenseFile">
                                                    License Photo (image only) <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="licenseFile"
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png"
                                                    onChange={handleLicenseFileChange}
                                                    required
                                                />
                                                {licenseFile && (
                                                    <p className="text-xs text-slate-500">
                                                        Selected: {licenseFile.name}
                                                    </p>
                                                )}
                                            </div>
                                            <Button type="submit" disabled={isUploadingLicense} className="w-full md:w-auto">
                                                {isUploadingLicense ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    "Upload for review"
                                                )}
                                            </Button>
                                        </form>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="rentals" className="space-y-6">
                            <TabsList className="bg-white border border-slate-200 p-1">
                                <TabsTrigger value="rentals" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                                    Rentals
                                </TabsTrigger>
                                <TabsTrigger value="settings" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                                    Settings
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="rentals" className="space-y-6">
                                {/* Active Rentals */}
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg">Active Rentals</CardTitle>
                                                <CardDescription>Your current and upcoming bookings</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    {activeBookings.length} Active
                                                </Badge>
                                                <Link href="/bookings">
                                                    <Button variant="outline" size="sm" className="gap-2">
                                                        View All
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingBookings ? (
                                            <div className="text-center py-12">
                                                <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
                                                <p className="text-slate-600 font-medium">Loading bookings...</p>
                                            </div>
                                        ) : activeBookings.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                                    <Car className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <p className="text-slate-600 font-medium mb-2">No active bookings</p>
                                                <p className="text-sm text-slate-500 mb-4">Book a vehicle to get started</p>
                                                <Link href="/rent">
                                                    <Button variant="outline">Browse Vehicles</Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {activeBookings.map((booking) => (
                                                    <Link
                                                        key={booking._id}
                                                        href={`/rent/confirmation?bookingId=${booking._id}`}
                                                    >
                                                        <div className="group p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all bg-white cursor-pointer">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                                                        <Car className="h-6 w-6 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-900 mb-1">{booking.vehicleId.name}</p>
                                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                            <Calendar className="h-3 w-3" />
                                                                            <span>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</span>
                                                                        </div>
                                                                        {booking.vehicleId.category && (
                                                                            <Badge variant="outline" className="mt-1 text-xs">
                                                                                {booking.vehicleId.category}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right flex items-center gap-4">
                                                                    <div>
                                                                        <p className="text-lg font-bold text-slate-900">
                                                                            Rs. {booking.totalAmount.toLocaleString("en-US", {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            })}
                                                                        </p>
                                                                        <Badge className={`mt-1 ${
                                                                            booking.bookingStatus === "active"
                                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                                                                : booking.bookingStatus === "confirmed"
                                                                                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"
                                                                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
                                                                        }`}>
                                                                            <Clock className="h-3 w-3 mr-1" />
                                                                            {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
                                                                        </Badge>
                                                                    </div>
                                                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Rental History */}
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg">Rental History</CardTitle>
                                                <CardDescription>Your past completed bookings</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="border-slate-300 text-slate-700">
                                                    {rentalHistory.length} Completed
                                                </Badge>
                                                <Link href="/bookings">
                                                    <Button variant="outline" size="sm" className="gap-2">
                                                        View All
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingBookings ? (
                                            <div className="text-center py-12">
                                                <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
                                                <p className="text-slate-600 font-medium">Loading rental history...</p>
                                            </div>
                                        ) : rentalHistory.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                                    <CheckCircle className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <p className="text-slate-600 font-medium mb-2">No rental history</p>
                                                <p className="text-sm text-slate-500">Your completed rentals will appear here</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {rentalHistory.map((booking) => (
                                                    <Link
                                                        key={booking._id}
                                                        href={`/rent/confirmation?bookingId=${booking._id}`}
                                                    >
                                                        <div className="group p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all bg-white cursor-pointer">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                                        <Car className="h-6 w-6 text-slate-500" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-900 mb-1">{booking.vehicleId.name}</p>
                                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                            <Calendar className="h-3 w-3" />
                                                                            <span>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</span>
                                                                        </div>
                                                                        {booking.vehicleId.category && (
                                                                            <Badge variant="outline" className="mt-1 text-xs">
                                                                                {booking.vehicleId.category}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right flex items-center gap-4">
                                                                    <div>
                                                                        <p className="text-lg font-bold text-slate-900">
                                                                            Rs. {booking.totalAmount.toLocaleString("en-US", {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            })}
                                                                        </p>
                                                                        <Badge variant="outline" className="mt-1 border-slate-300 text-slate-600">
                                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                                            Completed
                                                                        </Badge>
                                                                    </div>
                                                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="settings" className="space-y-6">
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Notification Preferences</CardTitle>
                                        <CardDescription>Manage how you receive updates</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <Bell className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 mb-1">Booking Alerts</p>
                                                    <p className="text-sm text-slate-600">Get notified about booking status and reminders</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences.alerts}
                                                onCheckedChange={(checked) =>
                                                    setPreferences((prev) => ({ ...prev, alerts: checked }))
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                    <Car className="h-5 w-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 mb-1">Recommendations</p>
                                                    <p className="text-sm text-slate-600">Receive personalized vehicle suggestions</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences.recommendations}
                                                onCheckedChange={(checked) =>
                                                    setPreferences((prev) => ({ ...prev, recommendations: checked }))
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                    <Mail className="h-5 w-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 mb-1">Marketing Emails</p>
                                                    <p className="text-sm text-slate-600">Updates about promotions and new features</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences.marketingEmails}
                                                onCheckedChange={(checked) =>
                                                    setPreferences((prev) => ({ ...prev, marketingEmails: checked }))
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}