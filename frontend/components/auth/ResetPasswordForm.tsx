"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

type Props = {
    defaultEmail?: string;
    defaultToken?: string;
};

export default function ResetPasswordForm({ defaultEmail, defaultToken }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState<string>(defaultEmail || "");
    const [token, setToken] = useState<string>(defaultToken || "");
    const [password, setPassword] = useState<string>("");
    const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false);

    useEffect(() => {
        const qpEmail = searchParams.get("email");
        const qpToken = searchParams.get("token");
        if (qpEmail && !email) setEmail(qpEmail);
        if (qpToken && !token) setToken(qpToken);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !token) {
            toast.error("Email and token are required");
            return;
        }
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        if (password !== passwordConfirmation) {
            toast.error("Passwords do not match");
            return;
        }

        setIsSubmitting(true);
        try {
            await axiosInstance.post("/reset-password", {
                email,
                token,
                password,
                password_confirmation: passwordConfirmation,
            });
            toast.success("Password reset successful. Please log in.");
            router.push("/login");
        } catch (err: any) {
            console.log( err?.response?.data?.errors?.password?.[0] );
            const message  = err?.response?.data?.errors?.password?.[0] || "Failed to reset password";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">

            <div className="space-y-2">
                <Label htmlFor="token">Reset token</Label>
                <Input
                    id="token"
                    type="text"
                    placeholder="Enter the token from your email"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="passwordConfirmation">Confirm new password</Label>
                <div className="relative">
                    <Input
                        id="passwordConfirmation"
                        type={showPasswordConfirmation ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPasswordConfirmation ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Resetting..." : "Reset password"}
            </Button>
        </form>
    );
}


