"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getProfile } from "@/lib/api";
import { Loader2 } from "lucide-react";

type ProfileUser = {
    name: string;
    email: string;
    role: string;
    image?: string;
    contact?: string;
    address?: string;
    isAccountVerified: boolean;
};

export default function ProfilePage() {
    const [user, setUser] = useState<ProfileUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            setIsLoading(true);
            try {
                const response = await getProfile();
                if (!isMounted) return;

                if (response?.user) {
                    setUser(response.user);
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Card className="shadow-lg border border-border/60">
                    <CardHeader>
                        <CardTitle className="text-2xl">Profile</CardTitle>
                        <CardDescription>Manage your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="text-lg font-medium">{user.name}</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-lg font-medium">{user.email}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Role</p>
                                <p className="text-lg font-medium capitalize">{user.role}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <p className="text-lg font-medium">
                                    {user.isAccountVerified ? "Verified" : "Pending verification"}
                                </p>
                            </div>
                        </div>
                        {user.contact && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">Contact</p>
                                    <p className="text-lg font-medium">{user.contact}</p>
                                </div>
                            </>
                        )}
                        {user.address && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">Address</p>
                                    <p className="text-lg font-medium">{user.address}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

