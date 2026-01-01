import express from "express";
import { 
    createBooking, 
    getUserBookings, 
    getBookingById, 
    completePayment, 
    cancelBooking,
    checkAvailability
} from "../controllers/bookingController.js";
import userAuth from "../middlewares/userAuth.js";

const router = express.Router();

// Public route - doesn't require authentication
router.get("/check-availability", checkAvailability);

// All other booking routes require authentication
router.use(userAuth);

router.post("/create", createBooking);
router.get("/my-bookings", getUserBookings);
router.get("/:id", getBookingById);
router.post("/:id/complete-payment", completePayment);
router.post("/:id/cancel", cancelBooking);

export default router;

