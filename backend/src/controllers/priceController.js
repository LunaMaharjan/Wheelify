import Vehicle from "../models/vehicle.model.js";

export const getVehiclePriceRange = async (req, res) => {
    try {
        const priceRange = await Vehicle.aggregate([
            {
                $match: {
                    approvalStatus: "approved",
                    status: "available",
                },
            },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$pricePerDay" },
                    maxPrice: { $max: "$pricePerDay" },
                },
            },
        ]);

        if (priceRange.length === 0) {
            return res.status(200).json({
                success: true,
                minPrice: 0,
                maxPrice: 0,
            });
        }

        res.status(200).json({
            success: true,
            minPrice: priceRange[0].minPrice,
            maxPrice: priceRange[0].maxPrice,
        });
    } catch (error) {
        console.error("Error fetching vehicle price range:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch vehicle price range",
        });
    }
};
