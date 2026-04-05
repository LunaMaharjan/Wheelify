import type { RevenueReportRow } from "./api";

function escapeCsvCell(val: string | number): string {
    if (val == null || val === undefined) return "";
    const s = String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function csvDate(iso: string): string {
    if (!iso) return "";
    try {
        return new Date(iso).toISOString().slice(0, 10);
    } catch {
        return "";
    }
}

/** Same columns as backend `bookingsToRevenueCsv`. */
export function buildRevenueCsvFromRows(
    rows: RevenueReportRow[],
    includeVendor: boolean
): string {
    const header = includeVendor
        ? [
              "Booking ID",
              "Created At",
              "Customer Name",
              "Customer Email",
              "Vendor Name",
              "Vendor Email",
              "Vehicle",
              "Start Date",
              "End Date",
              "Total Days",
              "Price Per Day",
              "Total Amount",
              "Booking Status",
              "Payment Status",
              "Pickup City",
          ]
        : [
              "Booking ID",
              "Created At",
              "Customer Name",
              "Customer Email",
              "Vehicle",
              "Start Date",
              "End Date",
              "Total Days",
              "Price Per Day",
              "Total Amount",
              "Booking Status",
              "Payment Status",
              "Pickup City",
          ];

    const lines = [header.map(escapeCsvCell).join(",")];

    for (const r of rows) {
        const cells = includeVendor
            ? [
                  r._id,
                  csvDate(r.createdAt),
                  r.customerName,
                  r.customerEmail,
                  r.vendorName ?? "",
                  r.vendorEmail ?? "",
                  r.vehicleName,
                  csvDate(r.startDate),
                  csvDate(r.endDate),
                  r.totalDays,
                  r.pricePerDay,
                  r.totalAmount,
                  r.bookingStatus,
                  r.paymentStatus,
                  r.pickupCity,
              ]
            : [
                  r._id,
                  csvDate(r.createdAt),
                  r.customerName,
                  r.customerEmail,
                  r.vehicleName,
                  csvDate(r.startDate),
                  csvDate(r.endDate),
                  r.totalDays,
                  r.pricePerDay,
                  r.totalAmount,
                  r.bookingStatus,
                  r.paymentStatus,
                  r.pickupCity,
              ];
        lines.push(cells.map(escapeCsvCell).join(","));
    }

    return "\uFEFF" + lines.join("\n");
}

export function downloadRevenueCsvFromRows(scope: "admin" | "vendor", rows: RevenueReportRow[]) {
    const includeVendor = scope === "admin";
    const csv = buildRevenueCsvFromRows(rows, includeVendor);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename =
        scope === "admin"
            ? `wheelify-platform-revenue-${stamp}-demo.csv`
            : `wheelify-my-revenue-${stamp}-demo.csv`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
