import express from "express";
import {
    initiateEsewaPayment,
    esewaPaymentCallback,
} from "../controllers/paymentController.js";
import userAuth from "../middlewares/userAuth.js";

const router = express.Router();

router.get("/esewa/callback", esewaPaymentCallback);
router.post("/esewa/initiate", userAuth, initiateEsewaPayment);

export default router;

