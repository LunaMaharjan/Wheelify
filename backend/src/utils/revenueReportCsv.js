/** CSV helpers for paid booking revenue reports (same filters as vendor getMyRevenue). */

export const revenueBookingFilter = {
    bookingStatus: { $in: ["confirmed", "active", "completed"] },
    paymentStatus: "paid",
};

function escapeCsvCell(val) {
    if (val == null || val === undefined) return "";
    const s = String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function formatDate(d) {
    if (!d) return "";
    return new Date(d).toISOString().slice(0, 10);
}

export function bookingsToRevenueCsv(bookings, { includeVendor }) {
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

    const rows = bookings.map((b) => {
        const u = b.userId;
        const v = b.vehicleId;
        const vendor = includeVendor && v?.vendorId ? v.vendorId : null;
        const cells = [
            b._id?.toString(),
            formatDate(b.createdAt),
            u?.name ?? "",
            u?.email ?? "",
            ...(includeVendor ? [vendor?.name ?? "", vendor?.email ?? ""] : []),
            v?.name ?? "",
            formatDate(b.startDate),
            formatDate(b.endDate),
            b.totalDays,
            b.pricePerDay,
            b.totalAmount,
            b.bookingStatus,
            b.paymentStatus,
            b.pickupLocation?.city ?? "",
        ];
        return cells.map(escapeCsvCell).join(",");
    });

    return "\uFEFF" + [header.map(escapeCsvCell).join(","), ...rows].join("\n");
}
