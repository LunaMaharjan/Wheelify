"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Upload, X, Edit } from "lucide-react";
import { toast } from "sonner";
import { uploadVehicle, updateVehicle } from "@/lib/api";
import { useEffect } from "react";

interface Vehicle {
    _id: string;
    name: string;
    type: string;
    description?: string;
    pricePerDay: number;
    location?: string;
    condition: string;
    bluebook?: string;
    images?: string[];
    approvalStatus?: string;
}

interface VehicleUploadFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    vehicle?: Vehicle | null; // For editing
}

export function VehicleUploadForm({ open, onOpenChange, onSuccess, vehicle }: VehicleUploadFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "",
        description: "",
        pricePerDay: "",
        location: "",
        condition: "",
    });
    const [bluebookFile, setBluebookFile] = useState<File | null>(null);
    const [bluebookUrl, setBluebookUrl] = useState<string>("");
    const [vehicleImages, setVehicleImages] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const isEditMode = !!vehicle;

    // Pre-fill form when editing
    useEffect(() => {
        if (vehicle && open) {
            setFormData({
                name: vehicle.name || "",
                type: vehicle.type || "",
                description: vehicle.description || "",
                pricePerDay: vehicle.pricePerDay?.toString() || "",
                location: vehicle.location || "",
                condition: vehicle.condition || "",
            });
            setBluebookUrl(vehicle.bluebook || "");
            setExistingImages(vehicle.images || []);
            setBluebookFile(null);
            setVehicleImages([]);
        } else if (!vehicle && open) {
            // Reset form for new vehicle
            setFormData({
                name: "",
                type: "",
                description: "",
                pricePerDay: "",
                location: "",
                condition: "",
            });
            setBluebookFile(null);
            setBluebookUrl("");
            setVehicleImages([]);
            setExistingImages([]);
        }
    }, [vehicle, open]);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleBluebookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Validate that it's an image
            if (!file.type.startsWith('image/')) {
                toast.error("Only image files are allowed for bluebook");
                e.target.value = ''; // Clear the input
                return;
            }
            setBluebookFile(file);
        }
    };

    const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setVehicleImages((prev) => [...prev, ...files]);
        }
    };

    const removeImage = (index: number) => {
        setVehicleImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.type || !formData.pricePerDay || !formData.condition) {
            toast.error("Please fill in all required fields");
            return;
        }

        // For new vehicles, bluebook is required. For edits, it's optional
        if (!isEditMode && !bluebookFile && !bluebookUrl) {
            toast.error("Please upload a bluebook document");
            return;
        }

        // Check if we have at least one image (either new or existing)
        if (vehicleImages.length === 0 && existingImages.length === 0) {
            toast.error("Please upload at least one vehicle image");
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("name", formData.name);
            formDataToSend.append("type", formData.type);
            formDataToSend.append("pricePerDay", formData.pricePerDay);
            formDataToSend.append("condition", formData.condition);
            if (formData.description) {
                formDataToSend.append("description", formData.description);
            }
            if (formData.location) {
                formDataToSend.append("location", formData.location);
            }
            
            // Only append bluebook if a new file is uploaded
            if (bluebookFile) {
                formDataToSend.append("bluebook", bluebookFile);
            }
            
            // Only append new images if uploaded
            vehicleImages.forEach((image) => {
                formDataToSend.append("vehicleImages", image);
            });

            let response;
            if (isEditMode && vehicle) {
                response = await updateVehicle(vehicle._id, formDataToSend);
            } else {
                response = await uploadVehicle(formDataToSend);
            }

            if (response?.success) {
                toast.success(
                    isEditMode 
                        ? "Vehicle updated and resubmitted successfully! Waiting for admin approval."
                        : "Vehicle uploaded successfully! Waiting for admin approval."
                );
                // Reset form
                setFormData({
                    name: "",
                    type: "",
                    description: "",
                    pricePerDay: "",
                    location: "",
                    condition: "",
                });
                setBluebookFile(null);
                setBluebookUrl("");
                setVehicleImages([]);
                setExistingImages([]);
                // Close dialog and refresh only after successful submission
                onOpenChange(false);
                onSuccess();
            } else {
                toast.error(response?.message || `Failed to ${isEditMode ? 'update' : 'upload'} vehicle`);
            }
        } catch (error: any) {
            console.error(`${isEditMode ? 'Update' : 'Upload'} error:`, error);
            toast.error(error?.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'upload'} vehicle`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditMode ? (
                            <>
                                <Edit className="h-5 w-5" />
                                Edit Vehicle
                            </>
                        ) : (
                            <>
                                <Upload className="h-5 w-5" />
                                Upload New Vehicle
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode 
                            ? "Update the vehicle details and resubmit for admin review."
                            : "Fill in the details and upload your vehicle. It will be reviewed by an admin before being published."
                        }
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Vehicle Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                placeholder="e.g., Honda Civic 2020"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">
                                Vehicle Type <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => handleInputChange("type", value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="car">Car</SelectItem>
                                    <SelectItem value="bike">Bike</SelectItem>
                                    <SelectItem value="scooter">Scooter</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            placeholder="Describe your vehicle..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pricePerDay">
                                Price per Day (Rs) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="pricePerDay"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.pricePerDay}
                                onChange={(e) => handleInputChange("pricePerDay", e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="condition">
                                Condition <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.condition}
                                onValueChange={(value) => handleInputChange("condition", value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="excellent">Excellent</SelectItem>
                                    <SelectItem value="good">Good</SelectItem>
                                    <SelectItem value="fair">Fair</SelectItem>
                                    <SelectItem value="poor">Poor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => handleInputChange("location", e.target.value)}
                            placeholder="e.g., Kathmandu, Nepal"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bluebook">
                            Bluebook Document {!isEditMode && <span className="text-destructive">*</span>}
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="bluebook"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleBluebookChange}
                                className="cursor-pointer"
                                required={!isEditMode}
                            />
                            {bluebookFile && (
                                <span className="text-sm text-muted-foreground">
                                    {bluebookFile.name}
                                </span>
                            )}
                            {isEditMode && bluebookUrl && !bluebookFile && (
                                <span className="text-sm text-muted-foreground">
                                    Current file uploaded
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isEditMode 
                                ? "Upload a new bluebook image to replace the existing one (optional)"
                                : "Upload an image of your vehicle bluebook (JPEG, PNG, JPG only)"
                            }
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vehicleImages">
                            Vehicle Images <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="vehicleImages"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImagesChange}
                            className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                            {isEditMode
                                ? "Upload new images to add to existing ones (optional)"
                                : "Upload at least one image of your vehicle (multiple images allowed)"
                            }
                        </p>
                        {existingImages.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs font-medium mb-2">Existing Images:</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {existingImages.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={image}
                                                alt={`Existing ${index + 1}`}
                                                className="w-full h-20 object-cover rounded-md"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {vehicleImages.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs font-medium mb-2">New Images:</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {vehicleImages.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={URL.createObjectURL(image)}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-20 object-cover rounded-md"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => removeImage(index)}
                                                disabled={isSubmitting}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (!isSubmitting) {
                                    onOpenChange(false);
                                }
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Cancel"
                            )}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditMode ? "Updating..." : "Uploading..."}
                                </>
                            ) : (
                                <>
                                    {isEditMode ? (
                                        <>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Update & Resubmit
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload Vehicle
                                        </>
                                    )}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

