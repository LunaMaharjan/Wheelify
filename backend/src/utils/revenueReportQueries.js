import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import Vehicle from "../models/vehicle.model.js";
import User from "../models/user.model.js";
import { revenueBookingFilter } from "./revenueReportCsv.js";

function isValidObjectId(id) {
    return Boolean(id && mongoose.Types.ObjectId.isValid(id));
}

export function parseRevenueQueryParams(query = {}) {
    return {
        userId: isValidObjectId(query.userId) ? query.userId : undefined,
        vendorId: isValidObjectId(query.vendorId) ? query.vendorId : undefined,
        vehicleId: isValidObjectId(query.vehicleId) ? query.vehicleId : undefined,
        from:
            typeof query.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.from)
                ? query.from
                : undefined,
        to:
            typeof query.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.to)
                ? query.to
                : undefined,
    };
}

export async function buildAdminRevenueMatch(params) {
    const match = { ...revenueBookingFilter };

    if (params.userId) {
        match.userId = params.userId;
    }

    if (params.vendorId && params.vehicleId) {
        const v = await Vehicle.findOne({
            _id: params.vehicleId,
            vendorId: params.vendorId,
        })
            .select("_id")
            .lean();
        if (!v) {
            return { empty: true };
        }
        match.vehicleId = params.vehicleId;
    } else if (params.vehicleId) {
        match.vehicleId = params.vehicleId;
    } else if (params.vendorId) {
        const ids = await Vehicle.find({ vendorId: params.vendorId }).distinct("_id");
        if (!ids.length) {
            return { empty: true };
        }
        match.vehicleId = { $in: ids };
    }

    if (params.from || params.to) {
        match.createdAt = {};
        if (params.from) {
            match.createdAt.$gte = new Date(`${params.from}T00:00:00.000Z`);
        }
        if (params.to) {
            match.createdAt.$lte = new Date(`${params.to}T23:59:59.999Z`);
        }
    }

    return { match };
}

export async function queryAdminRevenueBookings(params) {
    const built = await buildAdminRevenueMatch(params);
    if (built.empty) {
        return [];
    }
    return Booking.find(built.match)
        .populate("userId", "name email")
        .populate({
            path: "vehicleId",
            select: "name vendorId",
            populate: { path: "vendorId", select: "name email" },
        })
        .sort({ createdAt: -1 });
}

export async function queryVendorRevenueBookings(vendorUserId, params) {
    const vehicleDocs = await Vehicle.find({ vendorId: vendorUserId }).select("_id");
    const vehicleIds = vehicleDocs.map((v) => v._id);
    if (!vehicleIds.length) {
        return [];
    }

    const match = {
        vehicleId: { $in: vehicleIds },
        ...revenueBookingFilter,
    };

    if (params.userId) {
        if (!isValidObjectId(params.userId)) {
            return [];
        }
        match.userId = params.userId;
    }

    if (params.vehicleId) {
        if (!isValidObjectId(params.vehicleId)) {
            return [];
        }
        const allowed = vehicleIds.some((id) => id.toString() === params.vehicleId);
        if (!allowed) {
            return [];
        }
        match.vehicleId = params.vehicleId;
    }

    if (params.from || params.to) {
        match.createdAt = {};
        if (params.from) {
            match.createdAt.$gte = new Date(`${params.from}T00:00:00.000Z`);
        }
        if (params.to) {
            match.createdAt.$lte = new Date(`${params.to}T23:59:59.999Z`);
        }
    }

    return Booking.find(match)
        .populate("userId", "name email")
        .populate("vehicleId", "name")
        .sort({ createdAt: -1 });
}

export function bookingToRevenueRow(booking, includeVendor) {
    const u = booking.userId;
    const v = booking.vehicleId;
    const vendor = includeVendor && v?.vendorId ? v.vendorId : null;

    const row = {
        _id: booking._id.toString(),
        createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : "",
        customerName: u?.name ?? "",
        customerEmail: u?.email ?? "",
        vehicleName: v?.name ?? "",
        startDate: booking.startDate ? new Date(booking.startDate).toISOString() : "",
        endDate: booking.endDate ? new Date(booking.endDate).toISOString() : "",
        totalDays: booking.totalDays,
        pricePerDay: booking.pricePerDay,
        totalAmount: booking.totalAmount,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        pickupCity: booking.pickupLocation?.city ?? "",
    };

    if (includeVendor) {
        row.vendorName = vendor?.name ?? "";
        row.vendorEmail = vendor?.email ?? "";
    }

    return row;
}

export async function getVendorRevenueFilterOptions(vendorUserId) {
    const vehicles = await Vehicle.find({ vendorId: vendorUserId })
        .select("name")
        .sort({ name: 1 })
        .lean();

    const vehicleIds = vehicles.map((v) => v._id);
    const vehicleOptions = vehicles.map((v) => ({
        _id: v._id.toString(),
        name: v.name,
    }));

    if (!vehicleIds.length) {
        return { vehicles: vehicleOptions, customers: [] };
    }

    const userIds = await Booking.distinct("userId", {
        vehicleId: { $in: vehicleIds },
        ...revenueBookingFilter,
    });

    const customers = await User.find({
        _id: { $in: userIds },
        role: "user",
    })
        .select("name email")
        .sort({ name: 1 })
        .lean();

    return {
        vehicles: vehicleOptions,
        customers: customers.map((c) => ({
            _id: c._id.toString(),
            name: c.name,
            email: c.email,
        })),
    };
}
