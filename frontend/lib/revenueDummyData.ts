import type { RevenueReportQuery, RevenueReportRow } from "./api";

export function summarizeRevenueRows(rows: RevenueReportRow[]) {
    return {
        count: rows.length,
        totalAmount: rows.reduce((sum, r) => sum + r.totalAmount, 0),
    };
}

function inCreatedDateRange(row: RevenueReportRow, q: RevenueReportQuery): boolean {
    const t = new Date(row.createdAt).getTime();
    if (q.from) {
        const start = new Date(`${q.from}T00:00:00.000Z`).getTime();
        if (t < start) return false;
    }
    if (q.to) {
        const end = new Date(`${q.to}T23:59:59.999Z`).getTime();
        if (t > end) return false;
    }
    return true;
}

export function filterAdminDummyRows(
    rows: RevenueReportRow[],
    q: RevenueReportQuery
): RevenueReportRow[] {
    return rows.filter((r) => {
        if (q.userId && r.filterCustomerUserId !== q.userId) return false;
        if (q.vendorId && r.filterVendorUserId !== q.vendorId) return false;
        if (q.vehicleId && r.filterVehicleId !== q.vehicleId) return false;
        if (!inCreatedDateRange(r, q)) return false;
        return true;
    });
}

export function filterVendorDummyRows(
    rows: RevenueReportRow[],
    q: RevenueReportQuery
): RevenueReportRow[] {
    return rows.filter((r) => {
        if (q.userId && r.filterCustomerUserId !== q.userId) return false;
        if (q.vehicleId && r.filterVehicleId !== q.vehicleId) return false;
        if (!inCreatedDateRange(r, q)) return false;
        return true;
    });
}

const ADMIN_BOOKING_STATUSES = ["completed", "active", "confirmed", "cancelled"] as const;
const ADMIN_PAYMENT_STATUSES = ["paid", "paid", "paid", "pending", "refunded"] as const;
const ADMIN_CITIES = ["Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Chitwan"];

const ADMIN_CUSTOMERS: { name: string; email: string }[] = [
    { name: "Alex Rivera", email: "alex@example.com" },
    { name: "Samira Khan", email: "samira@example.com" },
    { name: "Jordan Lee", email: "jordan@example.com" },
    { name: "Mina Patel", email: "mina@example.com" },
    { name: "Chris Okafor", email: "chris@example.com" },
    { name: "Priya Sharma", email: "priya@example.com" },
    { name: "Nirajan Thapa", email: "nirajan@example.com" },
    { name: "Elena Rossi", email: "elena@example.com" },
    { name: "David Chen", email: "david@example.com" },
    { name: "Anita Gurung", email: "anita@example.com" },
    { name: "James Wilson", email: "james@example.com" },
    { name: "Sita Magar", email: "sita@example.com" },
    { name: "Omar Hassan", email: "omar@example.com" },
    { name: "Riya Karki", email: "riya@example.com" },
    { name: "Tom Müller", email: "tom@example.com" },
    { name: "Bina Tamang", email: "bina@example.com" },
    { name: "Lucas Santos", email: "lucas@example.com" },
    { name: "Kavita Rao", email: "kavita@example.com" },
    { name: "Henry Brooks", email: "henry@example.com" },
    { name: "Maya Shrestha", email: "maya@example.com" },
];

const ADMIN_VENDORS: {
    name: string;
    email: string;
    vendorUserId: string;
}[] = [
    {
        name: "Nepal Wheels Pvt",
        email: "nepal.wheels@example.com",
        vendorUserId: "507f1f77bcf86cd7994390e01",
    },
    {
        name: "Valley Rentals",
        email: "hello@valleyrentals.example.com",
        vendorUserId: "507f1f77bcf86cd7994390e02",
    },
    {
        name: "Himalaya Drive Co",
        email: "book@himalayadrive.example.com",
        vendorUserId: "507f1f77bcf86cd7994390e03",
    },
    {
        name: "City Zoom Rentals",
        email: "support@cityzoom.example.com",
        vendorUserId: "507f1f77bcf86cd7994390e04",
    },
    {
        name: "Terai Motors Rent",
        email: "rent@teraimotors.example.com",
        vendorUserId: "507f1f77bcf86cd7994390e05",
    },
];

const ADMIN_VEHICLES: { name: string; vehicleId: string; vendorIdx: number; pricePerDay: number }[] =
    [
        { name: "Honda City 2022", vehicleId: "507f1f77bcf86cd7994390f01", vendorIdx: 0, pricePerDay: 45 },
        { name: "Suzuki Swift", vehicleId: "507f1f77bcf86cd7994390f02", vendorIdx: 1, pricePerDay: 38 },
        { name: "Toyota Hilux", vehicleId: "507f1f77bcf86cd7994390f03", vendorIdx: 0, pricePerDay: 95 },
        { name: "Hyundai Creta", vehicleId: "507f1f77bcf86cd7994390f04", vendorIdx: 2, pricePerDay: 55 },
        { name: "Mahindra Scorpio", vehicleId: "507f1f77bcf86cd7994390f05", vendorIdx: 2, pricePerDay: 72 },
        { name: "Nissan Magnite", vehicleId: "507f1f77bcf86cd7994390f06", vendorIdx: 3, pricePerDay: 42 },
        { name: "Ford EcoSport", vehicleId: "507f1f77bcf86cd7994390f07", vendorIdx: 3, pricePerDay: 48 },
        { name: "Tata Nexon EV", vehicleId: "507f1f77bcf86cd7994390f08", vendorIdx: 4, pricePerDay: 65 },
        { name: "Maruti Dzire", vehicleId: "507f1f77bcf86cd7994390f09", vendorIdx: 1, pricePerDay: 40 },
        { name: "Isuzu D-Max", vehicleId: "507f1f77bcf86cd7994390f0a", vendorIdx: 4, pricePerDay: 88 },
    ];

function adminOidSeq(i: number): string {
    const n = 0x99439011 + i;
    return `507f1f77bcf86cd7${n.toString(16).padStart(8, "0")}`;
}

function adminCustomerOid(i: number): string {
    const n = 0x994390d0 + (i % ADMIN_CUSTOMERS.length);
    return `507f1f77bcf86cd7${n.toString(16).padStart(8, "0")}`;
}

function buildDummyAdminRows(): RevenueReportRow[] {
    return Array.from({ length: 50 }, (_, i) => {
        const cust = ADMIN_CUSTOMERS[i % ADMIN_CUSTOMERS.length];
        const veh = ADMIN_VEHICLES[i % ADMIN_VEHICLES.length];
        const vend = ADMIN_VENDORS[veh.vendorIdx];
        const totalDays = 1 + (i % 14);
        const pricePerDay = veh.pricePerDay + (i % 5) * 2;
        const created = new Date(Date.UTC(2025, (i % 12), 1 + (i % 27), 10 + (i % 8), (i * 7) % 60));
        const start = new Date(created);
        start.setUTCDate(start.getUTCDate() + 3 + (i % 10));
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + totalDays);

        return {
            _id: adminOidSeq(i),
            createdAt: created.toISOString(),
            customerName: cust.name,
            customerEmail: cust.email,
            vendorName: vend.name,
            vendorEmail: vend.email,
            vehicleName: veh.name,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            totalDays,
            pricePerDay,
            totalAmount: totalDays * pricePerDay,
            bookingStatus: ADMIN_BOOKING_STATUSES[i % ADMIN_BOOKING_STATUSES.length],
            paymentStatus: ADMIN_PAYMENT_STATUSES[i % ADMIN_PAYMENT_STATUSES.length],
            pickupCity: ADMIN_CITIES[i % ADMIN_CITIES.length],
            filterCustomerUserId: adminCustomerOid(i),
            filterVendorUserId: vend.vendorUserId,
            filterVehicleId: veh.vehicleId,
        };
    });
}

/** Sample rows for admin revenue UI & demo CSV (includes vendor columns). */
export const DUMMY_ADMIN_REVENUE_ROWS: RevenueReportRow[] = buildDummyAdminRows();

const VENDOR_BOOKING_STATUSES = ["completed", "active", "confirmed"] as const;
const VENDOR_PAYMENT_STATUSES = ["paid", "paid", "pending"] as const;

const VENDOR_CUSTOMERS: { name: string; email: string }[] = [
    { name: "Mina Patel", email: "mina@example.com" },
    { name: "Chris Okafor", email: "chris@example.com" },
    { name: "Alex Rivera", email: "alex@example.com" },
    { name: "Samira Khan", email: "samira@example.com" },
    { name: "Jordan Lee", email: "jordan@example.com" },
    { name: "Priya Sharma", email: "priya@example.com" },
    { name: "Nirajan Thapa", email: "nirajan@example.com" },
    { name: "Elena Rossi", email: "elena@example.com" },
    { name: "David Chen", email: "david@example.com" },
    { name: "Anita Gurung", email: "anita@example.com" },
    { name: "James Wilson", email: "james@example.com" },
    { name: "Sita Magar", email: "sita@example.com" },
    { name: "Omar Hassan", email: "omar@example.com" },
    { name: "Riya Karki", email: "riya@example.com" },
    { name: "Tom Müller", email: "tom@example.com" },
];

const VENDOR_VEHICLES: { name: string; vehicleId: string; pricePerDay: number }[] = [
    { name: "Hyundai Creta", vehicleId: "607f1f77bcf86cd7994390f11", pricePerDay: 55 },
    { name: "Suzuki Baleno", vehicleId: "607f1f77bcf86cd7994390f12", pricePerDay: 42 },
    { name: "Honda Amaze", vehicleId: "607f1f77bcf86cd7994390f13", pricePerDay: 39 },
    { name: "Toyota Yaris", vehicleId: "607f1f77bcf86cd7994390f14", pricePerDay: 51 },
    { name: "Kia Sonet", vehicleId: "607f1f77bcf86cd7994390f15", pricePerDay: 47 },
];

function vendorOidSeq(i: number): string {
    const n = 0x99439021 + i;
    return `607f1f77bcf86cd7${n.toString(16).padStart(8, "0")}`;
}

function vendorCustomerOid(i: number): string {
    const n = 0x994390e0 + (i % VENDOR_CUSTOMERS.length);
    return `607f1f77bcf86cd7${n.toString(16).padStart(8, "0")}`;
}

function buildDummyVendorRows(): RevenueReportRow[] {
    return Array.from({ length: 50 }, (_, i) => {
        const cust = VENDOR_CUSTOMERS[i % VENDOR_CUSTOMERS.length];
        const veh = VENDOR_VEHICLES[i % VENDOR_VEHICLES.length];
        const totalDays = 1 + (i % 12);
        const pricePerDay = veh.pricePerDay + (i % 4);
        const created = new Date(Date.UTC(2025, (i % 11), 2 + (i % 25), 9 + (i % 10), (i * 11) % 60));
        const start = new Date(created);
        start.setUTCDate(start.getUTCDate() + 2 + (i % 8));
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + totalDays);

        return {
            _id: vendorOidSeq(i),
            createdAt: created.toISOString(),
            customerName: cust.name,
            customerEmail: cust.email,
            vehicleName: veh.name,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            totalDays,
            pricePerDay,
            totalAmount: totalDays * pricePerDay,
            bookingStatus: VENDOR_BOOKING_STATUSES[i % VENDOR_BOOKING_STATUSES.length],
            paymentStatus: VENDOR_PAYMENT_STATUSES[i % VENDOR_PAYMENT_STATUSES.length],
            pickupCity: ADMIN_CITIES[i % ADMIN_CITIES.length],
            filterCustomerUserId: vendorCustomerOid(i),
            filterVehicleId: veh.vehicleId,
        };
    });
}

/** Sample rows for vendor revenue UI & demo CSV (no vendor columns in CSV). */
export const DUMMY_VENDOR_REVENUE_ROWS: RevenueReportRow[] = buildDummyVendorRows();

export function getDummyAdminCustomerOptions(): {
    _id: string;
    name: string;
    email: string;
    role: string;
}[] {
    const m = new Map<
        string,
        { _id: string; name: string; email: string; role: string }
    >();
    for (const r of DUMMY_ADMIN_REVENUE_ROWS) {
        const id = r.filterCustomerUserId;
        if (id && !m.has(id)) {
            m.set(id, {
                _id: id,
                name: r.customerName,
                email: r.customerEmail,
                role: "user",
            });
        }
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getDummyAdminVendorOptions(): { _id: string; name: string; email: string }[] {
    const m = new Map<string, { _id: string; name: string; email: string }>();
    for (const r of DUMMY_ADMIN_REVENUE_ROWS) {
        const id = r.filterVendorUserId;
        if (id && !m.has(id)) {
            m.set(id, {
                _id: id,
                name: r.vendorName ?? "",
                email: r.vendorEmail ?? "",
            });
        }
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getDummyAdminVehiclesForVendor(vendorId: string): { _id: string; name: string }[] {
    const m = new Map<string, string>();
    for (const r of DUMMY_ADMIN_REVENUE_ROWS) {
        if (r.filterVendorUserId === vendorId && r.filterVehicleId) {
            m.set(r.filterVehicleId, r.vehicleName);
        }
    }
    return [...m.entries()]
        .map(([id, name]) => ({ _id: id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export function getDummyVendorCustomerOptions(): { _id: string; name: string; email: string }[] {
    const m = new Map<string, { _id: string; name: string; email: string }>();
    for (const r of DUMMY_VENDOR_REVENUE_ROWS) {
        const id = r.filterCustomerUserId;
        if (id && !m.has(id)) {
            m.set(id, { _id: id, name: r.customerName, email: r.customerEmail });
        }
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getDummyVendorVehicleOptions(): { _id: string; name: string }[] {
    const m = new Map<string, string>();
    for (const r of DUMMY_VENDOR_REVENUE_ROWS) {
        if (r.filterVehicleId) {
            m.set(r.filterVehicleId, r.vehicleName);
        }
    }
    return [...m.entries()]
        .map(([id, name]) => ({ _id: id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
