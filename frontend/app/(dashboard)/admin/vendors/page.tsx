"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Search,
    MoreVertical,
    Check,
    X,
    Loader2,
    Store,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getAllVendors, approveVendor, rejectVendor, toggleVendorVerification } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Vendor {
    _id: string;
    name: string;
    email: string;
    role: "vendor";
    image?: string;
    contact?: string;
    address?: string;
    isAccountVerified: boolean;
    createdAt: string;
    // Add vendor-specific fields here when backend is ready
    status?: "pending" | "approved" | "rejected";
}

export default function VendorsManagementPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        fetchVendors();
    }, []);

    useEffect(() => {
        let filtered = vendors;

        // Filter by search query
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (vendor) =>
                    vendor.name.toLowerCase().includes(query) ||
                    vendor.email.toLowerCase().includes(query)
            );
        }

        // Filter by tab
        if (activeTab === "pending") {
            filtered = filtered.filter(
                (vendor) => !vendor.isAccountVerified || vendor.status === "pending"
            );
        } else if (activeTab === "verified") {
            filtered = filtered.filter((vendor) => vendor.isAccountVerified);
        }

        setFilteredVendors(filtered);
    }, [searchQuery, vendors, activeTab]);

    const fetchVendors = async () => {
        setIsLoading(true);
        try {
            const response = await getAllVendors();
            if (response?.success && response?.vendors) {
                setVendors(response.vendors);
                setFilteredVendors(response.vendors);
            }
        } catch (error: any) {
            console.error("Failed to fetch vendors:", error);
            toast.error("Failed to fetch vendors", {
                description: error.response?.data?.message || "An error occurred while fetching vendors",
            });
            setVendors([]);
            setFilteredVendors([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveVendor = async (vendor: Vendor) => {
        try {
            await approveVendor(vendor._id);
            toast.success("Vendor approved successfully");
            fetchVendors();
        } catch (error: any) {
            toast.error("Failed to approve vendor", {
                description: error.response?.data?.message || "An error occurred while approving the vendor",
            });
        }
    };

    const handleRejectVendor = async (vendor: Vendor) => {
        try {
            await rejectVendor(vendor._id);
            toast.success("Vendor rejected successfully");
            fetchVendors();
        } catch (error: any) {
            toast.error("Failed to reject vendor", {
                description: error.response?.data?.message || "An error occurred while rejecting the vendor",
            });
        }
    };

    const handleToggleVerification = async (vendor: Vendor) => {
        try {
            await toggleVendorVerification(vendor._id, !vendor.isAccountVerified);
            toast.success(`Vendor ${!vendor.isAccountVerified ? "verified" : "unverified"} successfully`);
            fetchVendors();
        } catch (error: any) {
            toast.error("Failed to update vendor", {
                description: error.response?.data?.message || "An error occurred while updating the vendor",
            });
        }
    };

    const getUserInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const pendingCount = vendors.filter(
        (v) => !v.isAccountVerified || v.status === "pending"
    ).length;
    const verifiedCount = vendors.filter((v) => v.isAccountVerified).length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Vendor Management</h2>
                <p className="text-muted-foreground">
                    Manage and approve vendor registrations
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Vendors</CardTitle>
                            <CardDescription>
                                Manage vendor accounts and applications
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search vendors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="all">All Vendors</TabsTrigger>
                            <TabsTrigger value="pending">
                                Pending ({pendingCount})
                            </TabsTrigger>
                            <TabsTrigger value="verified">
                                Verified ({verifiedCount})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : filteredVendors.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    {searchQuery
                                        ? "No vendors found matching your search"
                                        : "No vendors found"}
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Vendor</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Joined</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredVendors.map((vendor) => (
                                                <TableRow key={vendor._id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={vendor.image} alt={vendor.name} />
                                                                <AvatarFallback>
                                                                    <Store className="h-4 w-4" />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium">{vendor.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{vendor.email}</TableCell>
                                                    <TableCell>{vendor.contact || "N/A"}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Badge
                                                                variant={vendor.isAccountVerified ? "default" : "secondary"}
                                                            >
                                                                {vendor.isAccountVerified ? "Verified" : "Unverified"}
                                                            </Badge>
                                                            {vendor.status && (
                                                                <Badge variant="outline" className="capitalize">
                                                                    {vendor.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{formatDate(vendor.createdAt)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                {!vendor.isAccountVerified && (
                                                                    <>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleApproveVendor(vendor)}
                                                                        >
                                                                            <Check className="mr-2 h-4 w-4" />
                                                                            Approve
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleRejectVendor(vendor)}
                                                                        >
                                                                            <X className="mr-2 h-4 w-4" />
                                                                            Reject
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                    </>
                                                                )}
                                                                <DropdownMenuItem
                                                                    onClick={() => handleToggleVerification(vendor)}
                                                                >
                                                                    {vendor.isAccountVerified ? (
                                                                        <>
                                                                            <X className="mr-2 h-4 w-4" />
                                                                            Unverify
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Check className="mr-2 h-4 w-4" />
                                                                            Verify
                                                                        </>
                                                                    )}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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
        </div>
    );
}
