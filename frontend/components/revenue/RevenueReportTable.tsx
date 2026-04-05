"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import type { RevenueReportRow } from "@/lib/api";

function fmtDate(d: string) {
    if (!d) return "—";
    try {
        return format(parseISO(d), "MMM d, yyyy");
    } catch {
        return "—";
    }
}

export function RevenueReportTable({
    rows,
    showVendor,
}: {
    rows: RevenueReportRow[];
    showVendor: boolean;
}) {
    if (rows.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-8 text-center">
                No paid bookings match these filters.
            </p>
        );
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="whitespace-nowrap">Created</TableHead>
                        <TableHead className="whitespace-nowrap">Customer</TableHead>
                        {showVendor ? (
                            <TableHead className="whitespace-nowrap">Vendor</TableHead>
                        ) : null}
                        <TableHead className="whitespace-nowrap">Vehicle</TableHead>
                        <TableHead className="whitespace-nowrap">Rental start</TableHead>
                        <TableHead className="whitespace-nowrap">Rental end</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Days</TableHead>
                        <TableHead className="text-right whitespace-nowrap">$/day</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">City</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row._id}>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                {fmtDate(row.createdAt)}
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{row.customerName || "—"}</div>
                                <div className="text-xs text-muted-foreground">
                                    {row.customerEmail || ""}
                                </div>
                            </TableCell>
                            {showVendor ? (
                                <TableCell>
                                    <div className="font-medium">{row.vendorName || "—"}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {row.vendorEmail || ""}
                                    </div>
                                </TableCell>
                            ) : null}
                            <TableCell className="max-w-[140px] truncate">
                                {row.vehicleName || "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                {fmtDate(row.startDate)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                {fmtDate(row.endDate)}
                            </TableCell>
                            <TableCell className="text-right">{row.totalDays}</TableCell>
                            <TableCell className="text-right">
                                ${row.pricePerDay.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                ${row.totalAmount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="capitalize">
                                    {row.bookingStatus}
                                </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                {row.pickupCity || "—"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
