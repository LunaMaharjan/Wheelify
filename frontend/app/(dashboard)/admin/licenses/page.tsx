"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getLicenseSubmissions, reviewLicenseSubmission } from "@/lib/api";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

type LicenseSubmission = {
    _id: string;
    name: string;
    email: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    licenseImage?: string;
    licenseStatus?: "pending" | "approved" | "rejected" | "none";
    licenseReviewNote?: string;
    licenseUploadedAt?: string;
    licenseReviewedAt?: string;
};

const statusBadge = (status?: string) => {
    switch (status) {
        case "approved":
            return { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
        case "pending":
            return { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" };
        case "rejected":
            return { label: "Rejected", className: "bg-rose-100 text-rose-700 border-rose-200" };
        default:
            return { label: "Not uploaded", className: "bg-slate-100 text-slate-700 border-slate-200" };
    }
};

export default function LicenseReviewPage() {
    const [submissions, setSubmissions] = useState<LicenseSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [rejectNote, setRejectNote] = useState("");
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [viewing, setViewing] = useState<LicenseSubmission | null>(null);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            const response = await getLicenseSubmissions();
            if (response?.success && response?.submissions) {
                setSubmissions(response.submissions);
            } else {
                setSubmissions([]);
            }
        } catch (error) {
            console.error("Failed to load license submissions:", error);
            toast.error("Failed to load license submissions");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await reviewLicenseSubmission(id, "approved");
            toast.success("License approved");
            fetchSubmissions();
        } catch (error: any) {
            toast.error("Failed to approve license", {
                description: error.response?.data?.message,
            });
        }
    };

    const handleReject = async () => {
        if (!rejectingId) return;
        try {
            await reviewLicenseSubmission(rejectingId, "rejected", rejectNote);
            toast.success("License rejected");
            setRejectingId(null);
            setRejectNote("");
            fetchSubmissions();
        } catch (error: any) {
            toast.error("Failed to reject license", {
                description: error.response?.data?.message,
            });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">License Reviews</h2>
                <p className="text-muted-foreground">Review and approve user license uploads</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Submissions</CardTitle>
                            <CardDescription>Pending and processed license uploads</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">
                            No license submissions yet.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>License #</TableHead>
                                        <TableHead>Expiry</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Uploaded</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {submissions.map((submission) => {
                                        const badge = statusBadge(submission.licenseStatus);
                                        return (
                                            <TableRow key={submission._id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{submission.name}</span>
                                                        <span className="text-xs text-muted-foreground">{submission.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{submission.licenseNumber || "—"}</TableCell>
                                                <TableCell>
                                                    {submission.licenseExpiry
                                                        ? new Date(submission.licenseExpiry).toLocaleDateString()
                                                        : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={badge.className}>
                                                        {badge.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {submission.licenseUploadedAt
                                                        ? new Date(submission.licenseUploadedAt).toLocaleDateString()
                                                        : "—"}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setViewing(submission)}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        disabled={submission.licenseStatus === "approved"}
                                                        onClick={() => handleApprove(submission._id)}
                                                    >
                                                        <ShieldCheck className="h-4 w-4 mr-2" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setRejectingId(submission._id)}
                                                        disabled={submission.licenseStatus === "rejected"}
                                                    >
                                                        <X className="h-4 w-4 mr-2" />
                                                        Reject
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject license submission</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="rejectNote">Reason (optional)</Label>
                            <Input
                                id="rejectNote"
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder="Provide a short note"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setRejectingId(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleReject}>
                                Reject
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>License submission</DialogTitle>
                    </DialogHeader>
                    {viewing && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="font-semibold">{viewing.name}</p>
                                <p className="text-sm text-muted-foreground">{viewing.email}</p>
                            </div>
                            {viewing.licenseImage && (
                                <img
                                    src={viewing.licenseImage}
                                    alt="License"
                                    className="w-full rounded-lg border"
                                />
                            )}
                            {viewing.licenseReviewNote && (
                                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    {viewing.licenseReviewNote}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

