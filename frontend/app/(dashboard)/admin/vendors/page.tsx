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
import { getAllVendors, approveVendor, rejectVendor, toggleVendorVerification, getVendorApplications, getVendorApplicationDetails } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, FileText } from "lucide-react";

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
    status?: "pending" | "approved" | "rejected";
}

interface VendorApplication {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    citizenshipFront: string;
    citizenshipBack: string;
    otherDocuments: string[];
    status: string;
    rejectionMessage?: string;
    createdAt: string;
}

export default function VendorsManagementPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
    const [applications, setApplications] = useState<Record<string, VendorApplication>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [rejectionMessage, setRejectionMessage] = useState("");
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [isViewApplicationOpen, setIsViewApplicationOpen] = useState(false);
    const [viewingApplication, setViewingApplication] = useState<VendorApplication | null>(null);

    useEffect(() => {
        fetchVendors();
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await getVendorApplications();
            if (response?.success && response?.applications) {
                const appsMap: Record<string, VendorApplication> = {};
                response.applications.forEach((app: VendorApplication) => {
                    appsMap[app.userId._id] = app;
                });
                setApplications(appsMap);
            }
        } catch (error) {
            console.error("Failed to fetch applications:", error);
        }
    };

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
            fetchApplications();
        } catch (error: any) {
            toast.error("Failed to approve vendor", {
                description: error.response?.data?.message || "An error occurred while approving the vendor",
            });
        }
    };

    const handleRejectVendor = async () => {
        if (!selectedVendor) return;
        if (!rejectionMessage.trim()) {
            toast.error("Please provide a rejection message");
            return;
        }

        try {
            await rejectVendor(selectedVendor._id, rejectionMessage);
            toast.success("Vendor rejected successfully");
            setIsRejectDialogOpen(false);
            setRejectionMessage("");
            setSelectedVendor(null);
            fetchVendors();
            fetchApplications();
        } catch (error: any) {
            toast.error("Failed to reject vendor", {
                description: error.response?.data?.message || "An error occurred while rejecting the vendor",
            });
        }
    };

    const openRejectDialog = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setRejectionMessage("");
        setIsRejectDialogOpen(true);
    };

    const handleViewApplication = async (vendor: Vendor) => {
        try {
            const application = applications[vendor._id];
            if (application) {
                setViewingApplication(application);
                setIsViewApplicationOpen(true);
            } else {
                // Try to fetch application details
                const response = await getVendorApplicationDetails(vendor._id);
                if (response?.success && response?.application) {
                    setViewingApplication(response.application);
                    setIsViewApplicationOpen(true);
                } else {
                    toast.error("Application not found");
                }
            }
        } catch (error: any) {
            toast.error("Failed to load application", {
                description: error.response?.data?.message || "An error occurred",
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
                                                        <div className="flex items-center justify-end gap-2">
                                                            {applications[vendor._id] && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleViewApplication(vendor)}
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Application
                                                                </Button>
                                                            )}
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
                                                                                onClick={() => openRejectDialog(vendor)}
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

            {/* Reject Vendor Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Vendor Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this vendor application. This message will be sent to the vendor via email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejectionMessage">
                                Rejection Message <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="rejectionMessage"
                                placeholder="Enter the reason for rejection..."
                                value={rejectionMessage}
                                onChange={(e) => setRejectionMessage(e.target.value)}
                                rows={4}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsRejectDialogOpen(false);
                                    setRejectionMessage("");
                                    setSelectedVendor(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleRejectVendor}
                                disabled={!rejectionMessage.trim()}
                            >
                                Reject Vendor
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Application Dialog */}
            <Dialog open={isViewApplicationOpen} onOpenChange={setIsViewApplicationOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Vendor Application Details</DialogTitle>
                        <DialogDescription>
                            Review the vendor application documents
                        </DialogDescription>
                    </DialogHeader>
                    {viewingApplication && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Applicant Information</h3>
                                <p><strong>Name:</strong> {viewingApplication.userId.name}</p>
                                <p><strong>Email:</strong> {viewingApplication.userId.email}</p>
                                <p><strong>Status:</strong> <span className="capitalize">{viewingApplication.status}</span></p>
                                {viewingApplication.rejectionMessage && (
                                    <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                        <p className="text-sm"><strong>Rejection Reason:</strong> {viewingApplication.rejectionMessage}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Citizenship Front</h3>
                                <img
                                    src={viewingApplication.citizenshipFront}
                                    alt="Citizenship Front"
                                    className="w-full max-w-md border rounded-md"
                                />
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Citizenship Back</h3>
                                <img
                                    src={viewingApplication.citizenshipBack}
                                    alt="Citizenship Back"
                                    className="w-full max-w-md border rounded-md"
                                />
                            </div>

                            {viewingApplication.otherDocuments && viewingApplication.otherDocuments.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2">Other Documents</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {viewingApplication.otherDocuments.map((doc, index) => (
                                            <div key={index} className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileText className="h-4 w-4" />
                                                    <span>Document {index + 1}</span>
                                                </div>
                                                <img
                                                    src={doc}
                                                    alt={`Document ${index + 1}`}
                                                    className="w-full border rounded-md"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
