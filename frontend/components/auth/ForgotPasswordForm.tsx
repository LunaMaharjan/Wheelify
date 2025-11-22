"use client";

import React, { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showResetForm, setShowResetForm] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);
        try {
            await axiosInstance.post("/forgot-password", { email });
            setSuccess("If an account exists for that email, a reset token was sent.");
            setShowResetForm(true);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || "Something went wrong";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 w-full border p-4 rounded-md max-w-md">
            {!showResetForm ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    {error && (
                        toast.error(error)
                    )}
                    {success && (
                        <div className="text-sm text-green-600" role="status">
                            {success}
                        </div>
                    )}

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Sending..." : "Send reset token"}
                    </Button>
                </form>
            ) : (
                <div className="space-y-3">
                    {success && (
                        <div className="text-sm text-green-600" role="status">
                            {success}
                        </div>
                    )}
                    <ResetPasswordForm defaultEmail={email} />
                </div>
            )}
        </div>
    );
}


