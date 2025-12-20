"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitVendorApplication, getMyVendorApplication } from "@/lib/api";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useEffect } from "react";

export default function BecomeVendorPage() {
    const router = useRouter();
    const { user, requireAuth, isLoading: authLoading } = useAuthGuard();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<{
        status?: string;
        message?: string;
    } | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    const [citizenshipFront, setCitizenshipFront] = useState<File | null>(null);
    const [citizenshipBack, setCitizenshipBack] = useState<File | null>(null);

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) {
            return;
        }

        // Redirect if not authenticated
        if (!user) {
            requireAuth("/login");
            return;
        }

        // Check if user already has an application
        const checkApplication = async () => {
            setIsLoadingStatus(true);
            try {
                const response = await getMyVendorApplication();
                if (response?.success && response?.application) {
                    setApplicationStatus({
                        status: response.application.status,
                        message: response.application.rejectionMessage || undefined
                    });
                }
            } catch (error: any) {
                // Application not found is okay
                if (error.response?.status !== 404) {
                    console.error("Failed to check application status:", error);
                }
            } finally {
                setIsLoadingStatus(false);
            }
        };

        checkApplication();
    }, [user, authLoading]);

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "front" | "back"
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Only allow images
        if (!file.type.startsWith("image/")) {
            toast.error("Invalid file type. Only image files (JPEG, PNG, JPG) are allowed.");
            e.target.value = ''; // Clear the input
            return;
        }

        // Validate file size (15MB)
        if (file.size > 15 * 1024 * 1024) {
            toast.error("File size must be less than 15MB.");
            return;
        }

        if (type === "front") {
            setCitizenshipFront(file);
        } else if (type === "back") {
            setCitizenshipBack(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!citizenshipFront || !citizenshipBack) {
            toast.error("Please upload both citizenship front and back images.");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("citizenshipFront", citizenshipFront);
            formData.append("citizenshipBack", citizenshipBack);

            const response = await submitVendorApplication(formData);

            if (response?.success) {
                toast.success("Application submitted successfully! Please wait for admin approval.");
                setApplicationStatus({ status: "pending" });
                router.push("/profile");
            } else {
                toast.error(response?.message || "Failed to submit application");
            }
        } catch (error: any) {
            console.error("Submit application error:", error);
            toast.error(
                error.response?.data?.message || "Failed to submit application. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || isLoadingStatus) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (applicationStatus?.status === "pending") {
        return (
            <div className="container max-w-2xl mx-auto py-12 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Application Pending</CardTitle>
                        <CardDescription>
                            Your vendor application is currently under review.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            We will notify you via email once your application has been reviewed.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (applicationStatus?.status === "approved") {
        return (
            <div className="container max-w-2xl mx-auto py-12 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Application Approved</CardTitle>
                        <CardDescription>Your vendor application has been approved!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            You can now access the vendor dashboard.
                        </p>
                        <Button onClick={() => router.push("/vendor")}>
                            Go to Vendor Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (applicationStatus?.status === "rejected") {
        return (
            <div className="container max-w-2xl mx-auto py-12 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Application Rejected</CardTitle>
                        <CardDescription>
                            Your vendor application has been rejected.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {applicationStatus.message && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                                <p className="text-sm text-destructive">
                                    <strong>Reason:</strong> {applicationStatus.message}
                                </p>
                            </div>
                        )}
                        <p className="text-muted-foreground mb-4">
                            You can submit a new application after addressing the issues mentioned
                            above.
                        </p>
                        <Button onClick={() => setApplicationStatus(null)}>
                            Submit New Application
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-3xl mx-auto py-12 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>Become a Vendor</CardTitle>
                    <CardDescription>
                        Submit your application to become a vendor on Wheelify. Please provide the
                        required documents.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Citizenship Front */}
                        <div className="space-y-2">
                            <Label htmlFor="citizenshipFront">
                                Citizenship Front Image <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="citizenshipFront"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={(e) => handleFileChange(e, "front")}
                                    required
                                    disabled={isSubmitting}
                                />
                                {citizenshipFront && (
                                    <span className="text-sm text-muted-foreground">
                                        {citizenshipFront.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Citizenship Back */}
                        <div className="space-y-2">
                            <Label htmlFor="citizenshipBack">
                                Citizenship Back Image <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="citizenshipBack"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={(e) => handleFileChange(e, "back")}
                                    required
                                    disabled={isSubmitting}
                                />
                                {citizenshipBack && (
                                    <span className="text-sm text-muted-foreground">
                                        {citizenshipBack.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Submit Application
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

