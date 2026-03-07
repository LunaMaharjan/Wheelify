"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, X, Camera, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { uploadVendorPostRentalImages } from "@/lib/api";

interface Booking {
    _id: string;
    vehicleId: {
        _id: string;
        name: string;
        type?: string;
    };
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    bookingStatus: "pending" | "confirmed" | "active" | "completed" | "cancelled";
    endDate: string;
    vendorPostRentalImages?: string[];
    vendorPostRentalImagesUploadedAt?: string;
}

interface VendorPostRentalImageUploadProps {
    booking: Booking;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function VendorPostRentalImageUpload({
    booking,
    open,
    onOpenChange,
    onSuccess
}: VendorPostRentalImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [conditionNotes, setConditionNotes] = useState("");
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (files.length === 0) return;

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not a valid image file`);
                return false;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast.error(`${file.name} is too large. Maximum size is 10MB`);
                return false;
            }
            return true;
        });

        if (selectedImages.length + validFiles.length > 10) {
            toast.error("Maximum 10 images allowed");
            return;
        }

        // Create previews
        const newPreviews: string[] = [];
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                newPreviews.push(e.target?.result as string);
                if (newPreviews.length === validFiles.length) {
                    setImagePreviews(prev => [...prev, ...newPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });

        setSelectedImages(prev => [...prev, ...validFiles]);

        // Clear the input so the same files can be selected again if needed
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedImages.length === 0) {
            toast.error("Please select at least one image showing the vehicle condition after rental");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();

            // Add images to form data
            selectedImages.forEach((image) => {
                formData.append("vendorPostRentalImages", image);
            });

            // Add condition notes if provided
            if (conditionNotes.trim()) {
                formData.append("conditionNotes", conditionNotes.trim());
            }

            const response = await uploadVendorPostRentalImages(booking._id, formData);

            if (response.success) {
                toast.success("Post-rental condition images uploaded successfully!");
                onSuccess();
                onOpenChange(false);
                // Reset form
                setSelectedImages([]);
                setImagePreviews([]);
                setConditionNotes("");
            } else {
                toast.error(response.message || "Failed to upload images");
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error?.response?.data?.message || "Failed to upload images");
        } finally {
            setIsUploading(false);
        }
    };

    // Check if images have already been uploaded
    const alreadyUploaded = booking.vendorPostRentalImages && booking.vendorPostRentalImages.length > 0;

    // Check if rental period has ended and booking is not cancelled
    const rentalEnded = new Date() > new Date(booking.endDate);
    const canUpload = rentalEnded && booking.bookingStatus !== "cancelled";

    if (alreadyUploaded) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Images Already Uploaded
                        </DialogTitle>
                        <DialogDescription>
                            You have already uploaded post-rental condition images for this booking on{" "}
                            {booking.vendorPostRentalImagesUploadedAt &&
                                new Date(booking.vendorPostRentalImagesUploadedAt).toLocaleDateString()
                            }.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => onOpenChange(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    if (!canUpload) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Not Available</DialogTitle>
                        <DialogDescription>
                            You can upload post-rental condition images after the booking is completed and the rental period has ended.
                            <br />
                            <strong>Status:</strong> {booking.bookingStatus}
                            <br />
                            <strong>End Date:</strong> {new Date(booking.endDate).toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => onOpenChange(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Upload Post-Rental Vehicle Condition
                    </DialogTitle>
                    <DialogDescription>
                        Please upload photos showing the condition of <strong>{booking.vehicleId.name}</strong> after
                        it was returned by the customer. This will help with security deposit processing and damage assessment.
                        <br />
                        <span className="text-sm text-muted-foreground mt-1 block">
                            Customer: {booking.userId.name} | Rental ended: {new Date(booking.endDate).toLocaleDateString()}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="images">
                            Post-Rental Condition Images <span className="text-destructive">*</span>
                        </Label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                            <Input
                                id="images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <label
                                htmlFor="images"
                                className="cursor-pointer flex flex-col items-center space-y-2"
                            >
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    Click to select images or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Maximum 10 images, 10MB each (JPG, PNG, GIF, WebP)
                                </p>
                            </label>
                        </div>

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                {imagePreviews.map((preview, index) => (
                                    <Card key={index} className="relative">
                                        <CardContent className="p-2">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-24 object-cover rounded"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                                onClick={() => removeImage(index)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">
                            Condition Assessment <span className="text-muted-foreground">(Optional)</span>
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Describe the vehicle condition after return, any damage or issues found..."
                            value={conditionNotes}
                            onChange={(e) => setConditionNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isUploading || selectedImages.length === 0}>
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                `Upload ${selectedImages.length} Image${selectedImages.length !== 1 ? 's' : ''}`
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}