import Vehicle from "../models/vehicle.model.js";

// Public search for vehicles
export const searchVehicles = async (req, res) => {
    try {
        const {
            query,
            type,
            minPrice,
            maxPrice,
            location,
            condition,
            status,
            page = 1,
            limit = 12,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        // Build query
        const searchQuery = {
            approvalStatus: "approved", // Only show approved vehicles
            status: status || { $in: ["available", "rented"] } // Default to available and rented
        };

        // Text search
        if (query) {
            searchQuery.$or = [
                { name: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { location: { $regex: query, $options: "i" } }
            ];
        }

        // Type filter
        if (type) {
            searchQuery.type = type;
        }

        // Price range
        if (minPrice || maxPrice) {
            searchQuery.pricePerDay = {};
            if (minPrice) {
                searchQuery.pricePerDay.$gte = Number(minPrice);
            }
            if (maxPrice) {
                searchQuery.pricePerDay.$lte = Number(maxPrice);
            }
        }

        // Location filter
        if (location) {
            searchQuery.location = { $regex: location, $options: "i" };
        }

        // Condition filter
        if (condition) {
            searchQuery.condition = condition;
        }

        // Status filter (override default)
        if (status) {
            searchQuery.status = status;
        }

        // Sort options
        const sortOptions = {};
        const validSortFields = ["createdAt", "pricePerDay", "name"];
        const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
        sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;

        // Pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const vehicles = await Vehicle.find(searchQuery)
            .populate("vendorId", "name email contact")
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count for pagination
        const total = await Vehicle.countDocuments(searchQuery);

        return res.status(200).json({
            success: true,
            vehicles,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            },
            filters: {
                query,
                type,
                minPrice,
                maxPrice,
                location,
                condition,
                status
            }
        });
    } catch (error) {
        console.error("Search vehicles error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to search vehicles",
        });
    }
};

// Get single vehicle by ID (public)
export const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Vehicle ID is required",
            });
        }

        const vehicle = await Vehicle.findById(id)
            .populate("vendorId", "name email contact address")
            .lean();

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found",
            });
        }

        // Only return approved vehicles (or allow viewing pending/rejected for vendors/admins)
        // For public access, only show approved
        if (vehicle.approvalStatus !== "approved") {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found",
            });
        }

        return res.status(200).json({
            success: true,
            vehicle,
        });
    } catch (error) {
        console.error("Get vehicle by ID error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch vehicle",
        });
    }
};

