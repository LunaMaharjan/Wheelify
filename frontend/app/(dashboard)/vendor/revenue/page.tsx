"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DollarSign,
    TrendingUp,
    Calendar,
    CheckCircle,
    Loader2,
    FileSpreadsheet,
    RotateCcw,
} from "lucide-react";
import {
    getMyRevenue,
    getVendorRevenueReport,
    type RevenueReportQuery,
    type RevenueReportRow,
    type VendorRevenueFilterOptions,
} from "@/lib/api";
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
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
    DUMMY_VENDOR_REVENUE_ROWS,
    filterVendorDummyRows,
    getDummyVendorCustomerOptions,
    getDummyVendorVehicleOptions,
    summarizeRevenueRows,
} from "@/lib/revenueDummyData";

const ALL = "__all__";

function buildVendorQuery(
    userId: string,
    vehicleId: string,
    from: string,
    to: string
): RevenueReportQuery {
    const q: RevenueReportQuery = {};
    if (userId !== ALL) q.userId = userId;
    if (vehicleId !== ALL) q.vehicleId = vehicleId;
    if (from) q.from = from;
    if (to) q.to = to;
    return q;
}

function mergeCustomers(
    api: VendorRevenueFilterOptions["customers"],
    useDummy: boolean
): VendorRevenueFilterOptions["customers"] {
    const map = new Map<string, (typeof api)[0]>();
    api.forEach((c) => map.set(c._id, c));
    if (useDummy) {
        getDummyVendorCustomerOptions().forEach((c) => {
            if (!map.has(c._id)) map.set(c._id, c);
        });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function mergeVehicles(
    api: VendorRevenueFilterOptions["vehicles"],
    useDummy: boolean
): VendorRevenueFilterOptions["vehicles"] {
    const map = new Map<string, (typeof api)[0]>();
    api.forEach((v) => map.set(v._id, v));
    if (useDummy) {
        getDummyVendorVehicleOptions().forEach((v) => {
            if (!map.has(v._id)) map.set(v._id, v);
        });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export default function VendorRevenuePage() {
    const [revenue, setRevenue] = useState({
        total: 0,
        monthly: 0,
        completedRentals: 0,
        activeRentals: 0,
        totalRentals: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);

    const [filterOptions, setFilterOptions] = useState<VendorRevenueFilterOptions>({
        vehicles: [],
        customers: [],
    });
    const [userId, setUserId] = useState(ALL);
    const [vehicleId, setVehicleId] = useState(ALL);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [apiRows, setApiRows] = useState<RevenueReportRow[]>([]);
    const [appliedQuery, setAppliedQuery] = useState<RevenueReportQuery>({});
    const [reportLoading, setReportLoading] = useState(true);
    const [useDummyData, setUseDummyData] = useState(false);

    const initialApiFetchDone = useRef(false);
    const prevDummy = useRef(useDummyData);

    const customerSelectOptions = useMemo(
        () => mergeCustomers(filterOptions.customers, useDummyData),
        [filterOptions.customers, useDummyData]
    );
    const vehicleSelectOptions = useMemo(
        () => mergeVehicles(filterOptions.vehicles, useDummyData),
        [filterOptions.vehicles, useDummyData]
    );

    const displayRows = useMemo(() => {
        if (!useDummyData) return apiRows;
        return filterVendorDummyRows(DUMMY_VENDOR_REVENUE_ROWS, appliedQuery);
    }, [useDummyData, apiRows, appliedQuery]);

    const displaySummary = useMemo(() => summarizeRevenueRows(displayRows), [displayRows]);

    const tableLoading = !useDummyData && reportLoading;

    useEffect(() => {
        const loadStats = async () => {
            setStatsLoading(true);
            try {
                const response = await getMyRevenue();
                if (response?.success && response?.revenue) {
                    setRevenue(response.revenue);
                }
            } catch (error) {
                console.error("Failed to fetch revenue:", error);
                toast.error("Failed to load revenue summary");
            } finally {
                setStatsLoading(false);
            }
        };
        loadStats();
    }, []);

    const fetchReport = useCallback(async (q: RevenueReportQuery) => {
        setReportLoading(true);
        try {
            const res = await getVendorRevenueReport(q);
            if (res?.success) {
                setApiRows(res.rows);
                setFilterOptions(res.filterOptions);
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
            setReportLoading(false);
        }
    }, []);

    useEffect(() => {
        if (useDummyData) return;
        if (!initialApiFetchDone.current) {
            initialApiFetchDone.current = true;
            fetchReport({});
        }
    }, [useDummyData, fetchReport]);

    useEffect(() => {
        if (prevDummy.current && !useDummyData) {
            fetchReport(appliedQuery);
        }
        prevDummy.current = useDummyData;
    }, [useDummyData, appliedQuery, fetchReport]);

    const handleApply = () => {
        const q = buildVendorQuery(userId, vehicleId, from, to);
        setAppliedQuery(q);
        if (!useDummyData) {
            fetchReport(q);
        }
    };

    const handleReset = () => {
        setUserId(ALL);
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
            setVehicleId(ALL);
            setFrom("");
            setTo("");
            setAppliedQuery({});
        }
    };

    const statCards = [
        {
            title: "Total Revenue",
            value: `$${revenue.total.toLocaleString()}`,
            description: "All time earnings",
            icon: DollarSign,
        },
        {
            title: "Monthly Revenue",
            value: `$${revenue.monthly.toLocaleString()}`,
            description: "Last 30 days",
            icon: TrendingUp,
        },
        {
            title: "Completed Rentals",
            value: revenue.completedRentals.toString(),
            description: "Successfully completed",
            icon: CheckCircle,
        },
        {
            title: "Active Rentals",
            value: revenue.activeRentals.toString(),
            description: "Currently active",
            icon: Calendar,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight">Revenue Analytics</h2>
                    <p className="text-muted-foreground">
                        Track your earnings, filter paid bookings, and export CSV. Dummy mode
                        filters sample rows in the browser; otherwise data comes from the API.
                    </p>
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 w-fit">
                        <Switch
                            id="vendor-dummy-revenue"
                            checked={useDummyData}
                            onCheckedChange={onDummyToggle}
                        />
                        <Label htmlFor="vendor-dummy-revenue" className="cursor-pointer text-sm font-medium">
                            Load dummy data
                        </Label>
                    </div>
                </div>
                <RevenueReportCsvButton
                    scope="vendor"
                    query={appliedQuery}
                    dummyMode={useDummyData}
                    dummyRows={displayRows}
                />
            </div>

            {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                          <Card key={i}>
                              <CardHeader className="pb-2">
                                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                              </CardHeader>
                              <CardContent>
                                  <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                              </CardContent>
                          </Card>
                      ))
                    : statCards.map((card) => {
                          const Icon = card.icon;
                          return (
                              <Card key={card.title}>
                                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                      <CardTitle className="text-sm font-medium">
                                          {card.title}
                                      </CardTitle>
                                      <Icon className="h-4 w-4 text-muted-foreground" />
                                  </CardHeader>
                                  <CardContent>
                                      <div className="text-2xl font-bold">{card.value}</div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                          {card.description}
                                      </p>
                                  </CardContent>
                              </Card>
                          );
                      })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Summary</CardTitle>
                        <CardDescription>Overview of your earnings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Rentals:</span>
                                    <span className="font-semibold">{revenue.totalRentals}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Completed:</span>
                                    <span className="font-semibold">
                                        {revenue.completedRentals}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Active:</span>
                                    <span className="font-semibold">{revenue.activeRentals}</span>
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold">
                                            Total Revenue:
                                        </span>
                                        <span className="text-lg font-bold text-primary">
                                            ${revenue.total.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Performance</CardTitle>
                        <CardDescription>Revenue from the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <div className="space-y-4">
                                <div className="text-3xl font-bold text-primary">
                                    ${revenue.monthly.toLocaleString()}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Earnings from rentals created in the last 30 days.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div> */}

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Booking report</CardTitle>
                    </div>
                    <CardDescription>
                        Paid bookings only. Date range filters when the booking was created (UTC).
                        With dummy data on, demo customers and vehicles are added to the lists.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <Label>Customer</Label>
                            <Select value={userId} onValueChange={setUserId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All customers" />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    <SelectItem value={ALL}>All customers</SelectItem>
                                    {customerSelectOptions.map((c) => (
                                        <SelectItem key={c._id} value={c._id}>
                                            {c.name} ({c.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Vehicle</Label>
                            <Select value={vehicleId} onValueChange={setVehicleId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All vehicles" />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    <SelectItem value={ALL}>All vehicles</SelectItem>
                                    {vehicleSelectOptions.map((v) => (
                                        <SelectItem key={v._id} value={v._id}>
                                            {v.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="v-rev-from">Created from</Label>
                            <Input
                                id="v-rev-from"
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="v-rev-to">Created to</Label>
                            <Input
                                id="v-rev-to"
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={handleApply} disabled={tableLoading}>
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

                    <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground mb-4">
                            {useDummyData ? (
                                <>
                                    Demo · {displaySummary.count} booking
                                    {displaySummary.count === 1 ? "" : "s"} in view · Total{" "}
                                    <span className="font-semibold text-foreground">
                                        ${displaySummary.totalAmount.toLocaleString()}
                                    </span>
                                </>
                            ) : tableLoading ? (
                                "Loading…"
                            ) : (
                                <>
                                    {displaySummary.count} booking
                                    {displaySummary.count === 1 ? "" : "s"} in view · Total{" "}
                                    <span className="font-semibold text-foreground">
                                        ${displaySummary.totalAmount.toLocaleString()}
                                    </span>
                                </>
                            )}
                        </p>
                        {tableLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <RevenueReportTable rows={displayRows} showVendor={false} />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
