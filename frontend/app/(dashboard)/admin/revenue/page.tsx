"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueReportCsvButton } from "@/components/revenue/RevenueReportCsvButton";
import { RevenueReportTable } from "@/components/revenue/RevenueReportTable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
    getAdminRevenueReport,
    getAllUsers,
    getAllVendors,
    getAllVehicles,
    type RevenueReportQuery,
    type RevenueReportRow,
} from "@/lib/api";

const ALL = "__all__";

type UserOpt = { _id: string; name: string; email: string; role: string };
type VendorOpt = { _id: string; name: string; email: string };
type VehicleOpt = { _id: string; name: string };

function buildQuery(
    userId: string,
    vendorId: string,
    vehicleId: string,
    from: string,
    to: string
): RevenueReportQuery {
    const q: RevenueReportQuery = {};
    if (userId !== ALL) q.userId = userId;
    if (vendorId !== ALL) q.vendorId = vendorId;
    if (vehicleId !== ALL) q.vehicleId = vehicleId;
    if (from) q.from = from;
    if (to) q.to = to;
    return q;
}

export default function AdminRevenueReportPage() {
    const [users, setUsers] = useState<UserOpt[]>([]);
    const [vendors, setVendors] = useState<VendorOpt[]>([]);
    const [vehicles, setVehicles] = useState<VehicleOpt[]>([]);

    const [userId, setUserId] = useState(ALL);
    const [vendorId, setVendorId] = useState(ALL);
    const [vehicleId, setVehicleId] = useState(ALL);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [rows, setRows] = useState<RevenueReportRow[]>([]);
    const [summary, setSummary] = useState({ count: 0, totalAmount: 0 });
    const [appliedQuery, setAppliedQuery] = useState<RevenueReportQuery>({});
    const [loadingMeta, setLoadingMeta] = useState(true);
    const [loadingReport, setLoadingReport] = useState(true);

    const customers = useMemo(
        () => users.filter((u) => u.role === "user"),
        [users]
    );

    const loadVehiclesForVendor = useCallback(async (vid: string) => {
        if (vid === ALL) {
            setVehicles([]);
            setVehicleId(ALL);
            return;
        }
        try {
            const res = await getAllVehicles({ vendorId: vid });
            if (res?.success && res?.vehicles) {
                setVehicles(
                    res.vehicles.map((v: { _id: string; name: string }) => ({
                        _id: v._id,
                        name: v.name,
                    }))
                );
            } else {
                setVehicles([]);
            }
            setVehicleId(ALL);
        } catch {
            setVehicles([]);
            toast.error("Failed to load vehicles for vendor");
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingMeta(true);
            try {
                const [uRes, vRes] = await Promise.all([getAllUsers(), getAllVendors()]);
                if (cancelled) return;
                if (uRes?.success && uRes?.users) setUsers(uRes.users);
                if (vRes?.success && vRes?.vendors) setVendors(vRes.vendors);
            } catch {
                if (!cancelled) toast.error("Failed to load filter options");
            } finally {
                if (!cancelled) setLoadingMeta(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        loadVehiclesForVendor(vendorId);
    }, [vendorId, loadVehiclesForVendor]);

    const fetchReport = useCallback(async (q: RevenueReportQuery) => {
        setLoadingReport(true);
        try {
            const res = await getAdminRevenueReport(q);
            if (res?.success) {
                setRows(res.rows);
                setSummary(res.summary);
                setAppliedQuery(q);
            }
        } catch (e: unknown) {
            const msg =
                e && typeof e === "object" && "response" in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data
                          ?.message
                    : undefined;
            toast.error("Failed to load report", { description: msg });
            setRows([]);
            setSummary({ count: 0, totalAmount: 0 });
        } finally {
            setLoadingReport(false);
        }
    }, []);

    useEffect(() => {
        if (loadingMeta) return;
        fetchReport({});
    }, [loadingMeta, fetchReport]);

    const handleApply = () => {
        fetchReport(buildQuery(userId, vendorId, vehicleId, from, to));
    };

    const handleReset = () => {
        setUserId(ALL);
        setVendorId(ALL);
        setVehicleId(ALL);
        setFrom("");
        setTo("");
        fetchReport({});
    };

    if (loadingMeta) {
        return (
            <div className="flex min-h-[320px] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                Loading…
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Revenue report</h2>
                    <p className="text-muted-foreground">
                        Filter paid bookings (confirmed, active, or completed) by customer, vendor,
                        vehicle, and booking date. CSV uses the same filters as the table.
                    </p>
                </div>
                <RevenueReportCsvButton scope="admin" query={appliedQuery} />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Filters</CardTitle>
                    </div>
                    <CardDescription>
                        Booking date range uses when the booking was created (UTC).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Customer</Label>
                            <Select value={userId} onValueChange={setUserId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All customers" />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    <SelectItem value={ALL}>All customers</SelectItem>
                                    {customers.map((u) => (
                                        <SelectItem key={u._id} value={u._id}>
                                            {u.name} ({u.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Vendor</Label>
                            <Select value={vendorId} onValueChange={setVendorId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All vendors" />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    <SelectItem value={ALL}>All vendors</SelectItem>
                                    {vendors.map((v) => (
                                        <SelectItem key={v._id} value={v._id}>
                                            {v.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Vehicle</Label>
                            <Select
                                value={vehicleId}
                                onValueChange={setVehicleId}
                                disabled={vendorId === ALL}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            vendorId === ALL
                                                ? "Select a vendor first"
                                                : "All vehicles"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    <SelectItem value={ALL}>All vehicles</SelectItem>
                                    {vehicles.map((v) => (
                                        <SelectItem key={v._id} value={v._id}>
                                            {v.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rev-from">Created from</Label>
                            <Input
                                id="rev-from"
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rev-to">Created to</Label>
                            <Input
                                id="rev-to"
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={handleApply} disabled={loadingReport}>
                            {loadingReport ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Apply filters
                        </Button>
                        <Button type="button" variant="outline" onClick={handleReset}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Results</CardTitle>
                    <CardDescription>
                        {loadingReport ? (
                            "Loading…"
                        ) : (
                            <>
                                {summary.count} booking{summary.count === 1 ? "" : "s"} · Total{" "}
                                <span className="font-semibold text-foreground">
                                    ${summary.totalAmount.toLocaleString()}
                                </span>
                            </>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingReport ? (
                        <div className="flex justify-center py-12 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <RevenueReportTable rows={rows} showVendor />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
