import express from "express";
import { getVehiclePriceRange } from "../controllers/priceController.js";

const router = express.Router();

router.get("/vehicles/price-range", getVehiclePriceRange);

export default router;
