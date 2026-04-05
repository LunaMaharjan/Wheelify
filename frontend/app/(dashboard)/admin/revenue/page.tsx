"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
    getAdminRevenueReport,
    getAllUsers,
    getAllVendors,
    getAllVehicles,
    type RevenueReportQuery,
    type RevenueReportRow,
} from "@/lib/api";
import {
    DUMMY_ADMIN_REVENUE_ROWS,
    filterAdminDummyRows,
    getDummyAdminCustomerOptions,
    getDummyAdminVehiclesForVendor,
    getDummyAdminVendorOptions,
    summarizeRevenueRows,
} from "@/lib/revenueDummyData";

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

    const [apiRows, setApiRows] = useState<RevenueReportRow[]>([]);
    const [appliedQuery, setAppliedQuery] = useState<RevenueReportQuery>({});
    const [loadingMeta, setLoadingMeta] = useState(true);
    const [loadingReport, setLoadingReport] = useState(true);
    const [useDummyData, setUseDummyData] = useState(false);

    const initialApiFetchDone = useRef(false);
    const prevDummy = useRef(useDummyData);

    const customerSelectOptions = useMemo(() => {
        const customers = users.filter((u) => u.role === "user");
        const map = new Map<string, UserOpt>();
        customers.forEach((u) => map.set(u._id, u));
        if (useDummyData) {
            getDummyAdminCustomerOptions().forEach((u) => {
                if (!map.has(u._id)) map.set(u._id, u);
            });
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [users, useDummyData]);

    const vendorSelectOptions = useMemo(() => {
        const map = new Map<string, VendorOpt>();
        vendors.forEach((v) => map.set(v._id, v));
        if (useDummyData) {
            getDummyAdminVendorOptions().forEach((v) => {
                if (!map.has(v._id)) map.set(v._id, v);
            });
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [vendors, useDummyData]);

    const displayRows = useMemo(() => {
        if (!useDummyData) return apiRows;
        return filterAdminDummyRows(DUMMY_ADMIN_REVENUE_ROWS, appliedQuery);
    }, [useDummyData, apiRows, appliedQuery]);

    const displaySummary = useMemo(() => summarizeRevenueRows(displayRows), [displayRows]);

    const tableLoading = !useDummyData && loadingReport;

    const fetchVehiclesFromApi = useCallback(async (vid: string) => {
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
        if (vendorId === ALL) {
            setVehicles([]);
            setVehicleId(ALL);
            return;
        }
        if (useDummyData) {
            setVehicles(getDummyAdminVehiclesForVendor(vendorId));
            setVehicleId(ALL);
            return;
        }
        fetchVehiclesFromApi(vendorId);
    }, [vendorId, useDummyData, fetchVehiclesFromApi]);

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

    const fetchReport = useCallback(async (q: RevenueReportQuery) => {
        setLoadingReport(true);
        try {
            const res = await getAdminRevenueReport(q);
            if (res?.success) {
                setApiRows(res.rows);
                setAppliedQuery(q);
            }
        } catch (e: unknown) {
            const msg =
                e && typeof e === "object" && "response" in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data
                          ?.message
                    : undefined;
            toast.error("Failed to load report", { description: msg });
            setApiRows([]);
        } finally {
            setLoadingReport(false);
        }
    }, []);

    useEffect(() => {
        if (loadingMeta || useDummyData) return;
        if (!initialApiFetchDone.current) {
            initialApiFetchDone.current = true;
            fetchReport({});
        }
    }, [loadingMeta, useDummyData, fetchReport]);

    useEffect(() => {
        if (loadingMeta) return;
        if (prevDummy.current && !useDummyData) {
            fetchReport(appliedQuery);
        }
        prevDummy.current = useDummyData;
    }, [useDummyData, loadingMeta, appliedQuery, fetchReport]);

    const handleApply = () => {
        const q = buildQuery(userId, vendorId, vehicleId, from, to);
        setAppliedQuery(q);
        if (!useDummyData) {
            fetchReport(q);
        }
    };

    const handleReset = () => {
        setUserId(ALL);
        setVendorId(ALL);
        setVehicleId(ALL);
        setFrom("");
        setTo("");
        setAppliedQuery({});
        if (!useDummyData) {
            fetchReport({});
        }
    };

    const onDummyToggle = (checked: boolean) => {
        setUseDummyData(checked);
        if (checked) {
            setUserId(ALL);
            setVendorId(ALL);
            setVehicleId(ALL);
            setFrom("");
            setTo("");
            setAppliedQuery({});
            setVehicles([]);
        }
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
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight">Revenue report</h2>
                    <p className="text-muted-foreground">
                        Filter paid bookings (confirmed, active, or completed) by customer, vendor,
                        vehicle, and booking date. With dummy data, filters apply in the browser;
                        otherwise results come from the API.
                    </p>
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 w-fit">
                        <Switch
                            id="admin-dummy-revenue"
                            checked={useDummyData}
                            onCheckedChange={onDummyToggle}
                        />
                        <Label htmlFor="admin-dummy-revenue" className="cursor-pointer text-sm font-medium">
                            Load dummy data
                        </Label>
                    </div>
                </div>
                <RevenueReportCsvButton
                    scope="admin"
                    query={appliedQuery}
                    dummyMode={useDummyData}
                    dummyRows={displayRows}
                />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Filters</CardTitle>
                    </div>
                    <CardDescription>
                        Booking date range uses when the booking was created (UTC). Demo rows
                        include extra customers/vendors/vehicles in the lists so you can try filters.
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
                                    {customerSelectOptions.map((u) => (
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
                                    {vendorSelectOptions.map((v) => (
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
                        <Button
                            type="button"
                            onClick={handleApply}
                            disabled={tableLoading}
                        >
                            {tableLoading ? (
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
                        {useDummyData ? (
                            <>
                                Demo · {displaySummary.count} booking
                                {displaySummary.count === 1 ? "" : "s"} · Total{" "}
                                <span className="font-semibold text-foreground">
                                    ${displaySummary.totalAmount.toLocaleString()}
                                </span>
                            </>
                        ) : tableLoading ? (
                            "Loading…"
                        ) : (
                            <>
                                {displaySummary.count} booking{displaySummary.count === 1 ? "" : "s"}{" "}
                                · Total{" "}
                                <span className="font-semibold text-foreground">
                                    ${displaySummary.totalAmount.toLocaleString()}
                                </span>
                            </>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {tableLoading ? (
                        <div className="flex justify-center py-12 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <RevenueReportTable rows={displayRows} showVendor />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
