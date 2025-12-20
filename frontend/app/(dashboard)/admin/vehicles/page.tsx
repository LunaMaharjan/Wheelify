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
import {
    Search,
    Check,
    X,
    Loader2,
    Car,
    Eye,
    Clock,
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
import { getAllVehicles, approveVehicle, rejectVehicle } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { ImageModal } from "@/components/ui/image-modal";

interface Vehicle {
    _id: string;
    name: string;
    type: string;
    pricePerDay: number;
    condition: string;
    status: string;
    approvalStatus: "pending" | "approved" | "rejected";
    rejectionMessage?: string;
    images: string[];
    bluebook: string;
    description?: string;
    location?: string;
    vendorId: {
        _id: string;
        name: string;
        email: string;
    };
    reviewedBy?: {
        _id: string;
        name: string;
    };
    reviewedAt?: string;
    createdAt: string;
}

export default function VehiclesManagementPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("pending");
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [rejectionMessage, setRejectionMessage] = useState("");
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
    const [isApproving, setIsApproving] = useState<string | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);
    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        setIsLoading(true);
        try {
            const response = await getAllVehicles();
            if (response?.success && response?.vehicles) {
                setVehicles(response.vehicles);
                setFilteredVehicles(response.vehicles);
            }
        } catch (error) {
            console.error("Failed to fetch vehicles:", error);
            toast.error("Failed to fetch vehicles");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let filtered = vehicles;

        // Filter by tab
        if (activeTab === "pending") {
            filtered = filtered.filter((v) => v.approvalStatus === "pending");
        } else if (activeTab === "approved") {
            filtered = filtered.filter((v) => v.approvalStatus === "approved");
        } else if (activeTab === "rejected") {
            filtered = filtered.filter((v) => v.approvalStatus === "rejected");
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(
                (v) =>
                    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    v.vendorId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    v.vendorId.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredVehicles(filtered);
    }, [vehicles, activeTab, searchQuery]);

    const handleApproveVehicle = async (vehicle: Vehicle) => {
        setIsApproving(vehicle._id);
        try {
            const response = await approveVehicle(vehicle._id);
            if (response?.success) {
                toast.success("Vehicle approved successfully");
                fetchVehicles();
            } else {
                toast.error(response?.message || "Failed to approve vehicle");
            }
        } catch (error: any) {
            toast.error("Failed to approve vehicle", {
                description: error.response?.data?.message || "An error occurred",
            });
        } finally {
            setIsApproving(null);
        }
    };

    const handleRejectVehicle = async () => {
        if (!selectedVehicle) return;
        if (!rejectionMessage.trim()) {
            toast.error("Please provide a rejection message");
            return;
        }

        setIsRejecting(true);
        try {
            const response = await rejectVehicle(selectedVehicle._id, rejectionMessage);
            if (response?.success) {
                toast.success("Vehicle rejected successfully");
                setIsRejectDialogOpen(false);
                setRejectionMessage("");
                setSelectedVehicle(null);
                fetchVehicles();
            } else {
                toast.error(response?.message || "Failed to reject vehicle");
            }
        } catch (error: any) {
            toast.error("Failed to reject vehicle", {
                description: error.response?.data?.message || "An error occurred",
            });
        } finally {
            setIsRejecting(false);
        }
    };

    const openRejectDialog = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setRejectionMessage("");
        setIsRejectDialogOpen(true);
    };

    const handleViewVehicle = (vehicle: Vehicle) => {
        setViewingVehicle(vehicle);
        setIsViewDialogOpen(true);
    };

    const getApprovalStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return (
                    <Badge variant="default" className="bg-green-500">
                        <Check className="mr-1 h-3 w-3" />
                        Approved
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge variant="destructive">
                        <X className="mr-1 h-3 w-3" />
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

    const pendingCount = vehicles.filter((v) => v.approvalStatus === "pending").length;
    const approvedCount = vehicles.filter((v) => v.approvalStatus === "approved").length;
    const rejectedCount = vehicles.filter((v) => v.approvalStatus === "rejected").length;

    const handleViewImage = (imageSrc: string) => {
        setViewImage(imageSrc);
    };

    const handleCloseImage = () => {
        setViewImage(null);
    };
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Vehicle Management</h2>
                <p className="text-muted-foreground">
                    Review and manage vehicle uploads from vendors
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Vehicles</CardTitle>
                            <CardDescription>
                                Review and approve vehicle uploads
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search vehicles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="pending">
                                Pending ({pendingCount})
                            </TabsTrigger>
                            <TabsTrigger value="approved">
                                Approved ({approvedCount})
                            </TabsTrigger>
                            <TabsTrigger value="rejected">
                                Rejected ({rejectedCount})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : filteredVehicles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Car className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">
                                        No vehicles found
                                    </h3>
                                    <p className="text-muted-foreground text-center">
                                        {activeTab === "pending"
                                            ? "No pending vehicles to review"
                                            : activeTab === "approved"
                                            ? "No approved vehicles yet"
                                            : "No rejected vehicles"}
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Vehicle</TableHead>
                                            <TableHead>Vendor</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Price/Day</TableHead>
                                            <TableHead>Condition</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredVehicles.map((vehicle) => (
                                            <TableRow key={vehicle._id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {vehicle.images && vehicle.images.length > 0 ? (
                                                            <img
                                                                src={vehicle.images[0]}
                                                                alt={vehicle.name}
                                                                className="h-10 w-10 rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => handleViewImage(vehicle.images[0])}
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                                <Car className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium">{vehicle.name}</div>
                                                            {vehicle.location && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    {vehicle.location}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{vehicle.vendorId.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {vehicle.vendorId.email}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="capitalize">{vehicle.type}</TableCell>
                                                <TableCell>Rs. {vehicle.pricePerDay}</TableCell>
                                                <TableCell className="capitalize">{vehicle.condition}</TableCell>
                                                <TableCell>{getApprovalStatusBadge(vehicle.approvalStatus)}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleViewVehicle(vehicle)}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            {vehicle.approvalStatus === "pending" && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleApproveVehicle(vehicle)}
                                                                        disabled={isApproving === vehicle._id}
                                                                    >
                                                                        {isApproving === vehicle._id ? (
                                                                            <>
                                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                Approving...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Check className="mr-2 h-4 w-4" />
                                                                                Approve
                                                                            </>
                                                                        )}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => openRejectDialog(vehicle)}
                                                                        className="text-destructive"
                                                                        disabled={isRejecting}
                                                                    >
                                                                        <X className="mr-2 h-4 w-4" />
                                                                        Reject
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Reject Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Vehicle</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this vehicle. The vendor will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejectionMessage">
                                Rejection Reason <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="rejectionMessage"
                                value={rejectionMessage}
                                onChange={(e) => setRejectionMessage(e.target.value)}
                                placeholder="Enter the reason for rejection..."
                                rows={4}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsRejectDialogOpen(false)}
                                disabled={isRejecting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleRejectVehicle}
                                disabled={!rejectionMessage.trim() || isRejecting}
                            >
                                {isRejecting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Rejecting...
                                    </>
                                ) : (
                                    "Reject Vehicle"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Vehicle Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent 
                    className="max-w-3xl max-h-[90vh] overflow-y-auto"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>Vehicle Details</DialogTitle>
                        <DialogDescription>
                            Complete information about the vehicle
                        </DialogDescription>
                    </DialogHeader>
                    {viewingVehicle && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Vehicle Name</Label>
                                    <p className="font-medium">{viewingVehicle.name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Type</Label>
                                    <p className="font-medium capitalize">{viewingVehicle.type}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Price per Day</Label>
                                    <p className="font-medium">Rs. {viewingVehicle.pricePerDay}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Condition</Label>
                                    <p className="font-medium capitalize">{viewingVehicle.condition}</p>
                                </div>
                                {viewingVehicle.location && (
                                    <div>
                                        <Label className="text-muted-foreground">Location</Label>
                                        <p className="font-medium">{viewingVehicle.location}</p>
                                    </div>
                                )}
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">
                                        {getApprovalStatusBadge(viewingVehicle.approvalStatus)}
                                    </div>
                                </div>
                            </div>
                            {viewingVehicle.description && (
                                <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <p className="mt-1">{viewingVehicle.description}</p>
                                </div>
                            )}
                            <div>
                                <Label className="text-muted-foreground">Vendor Information</Label>
                                <div className="mt-1 space-y-1">
                                    <p className="font-medium">{viewingVehicle.vendorId.name}</p>
                                    <p className="text-sm text-muted-foreground">{viewingVehicle.vendorId.email}</p>
                                </div>
                            </div>
                            {viewingVehicle.images && viewingVehicle.images.length > 0 && (
                                <div>
                                    <Label className="text-muted-foreground">Vehicle Images</Label>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {viewingVehicle.images.map((image, index) => (
                                            <img
                                                key={index}
                                                src={image}
                                                alt={`Vehicle ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => handleViewImage(image)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {viewingVehicle.bluebook && (
                                <div>
                                    <Label className="text-muted-foreground">Bluebook Document</Label>
                                    <div className="mt-2">
                                            <img
                                                onClick={() => handleViewImage(viewingVehicle.bluebook)}
                                                src={viewingVehicle.bluebook}
                                                alt="Bluebook"
                                                className="h-32 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                            />
                                    </div>
                                </div>
                            )}
                            {viewingVehicle.rejectionMessage && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                    <Label className="text-destructive">Rejection Reason</Label>
                                    <p className="mt-1 text-sm text-destructive">
                                        {viewingVehicle.rejectionMessage}
                                    </p>
                                </div>
                            )}
                            {viewingVehicle.approvalStatus === "pending" && (
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsViewDialogOpen(false)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            setIsViewDialogOpen(false);
                                            openRejectDialog(viewingVehicle);
                                        }}
                                        disabled={isRejecting}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setIsViewDialogOpen(false);
                                            handleApproveVehicle(viewingVehicle);
                                        }}
                                        disabled={isApproving === viewingVehicle._id}
                                    >
                                        {isApproving === viewingVehicle._id ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Approving...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Approve
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Image Modal */}
            <ImageModal
                isOpen={viewImage !== null}
                imageSrc={viewImage}
                onClose={handleCloseImage}
                alt="Vehicle image"
            />
        </div>
    );
}

