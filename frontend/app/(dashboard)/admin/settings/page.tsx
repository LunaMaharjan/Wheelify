import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage platform settings and configurations
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>
                            Basic platform configuration
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="platform-name">Platform Name</Label>
                            <Input id="platform-name" defaultValue="Wheelify" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="support-email">Support Email</Label>
                            <Input id="support-email" type="email" placeholder="support@wheelify.com" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Maintenance Mode</Label>
                                <p className="text-sm text-muted-foreground">
                                    Temporarily disable the platform for maintenance
                                </p>
                            </div>
                            <Switch />
                        </div>
                        <Separator />
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Vendor Settings</CardTitle>
                        <CardDescription>
                            Configure vendor-related settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Auto-approve Vendors</Label>
                                <p className="text-sm text-muted-foreground">
                                    Automatically approve vendor registrations
                                </p>
                            </div>
                            <Switch />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vendor-commission">Default Commission Rate (%)</Label>
                            <Input id="vendor-commission" type="number" defaultValue="10" min="0" max="100" />
                        </div>
                        <Separator />
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
