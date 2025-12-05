"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfile } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ProfileUser = {
    name: string;
    email: string;
    role: string;
    image?: string;
    contact?: string;
    address?: string;
    isAccountVerified: boolean;
};

export default function AdminProfilePage() {
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

    const getUserInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
                <p className="text-muted-foreground">
                    Your admin account information
                </p>
            </div>

            <Card className="shadow-lg border border-border/60">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback className="text-lg">
                                {getUserInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">{user.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                <span>{user.email}</span>
                                <Badge variant={user.isAccountVerified ? "default" : "secondary"}>
                                    {user.isAccountVerified ? "Verified" : "Unverified"}
                                </Badge>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p className="text-lg font-medium capitalize">{user.role}</p>
                    </div>
                    <Separator />
                    {user.contact && (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Contact</p>
                                <p className="text-lg font-medium">{user.contact}</p>
                            </div>
                            <Separator />
                        </>
                    )}
                    {user.address && (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="text-lg font-medium">{user.address}</p>
                            </div>
                            <Separator />
                        </>
                    )}
                    <div>
                        <p className="text-sm text-muted-foreground">Account Status</p>
                        <p className="text-lg font-medium">
                            {user.isAccountVerified ? "Verified" : "Pending verification"}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
