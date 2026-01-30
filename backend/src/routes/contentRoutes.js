import express from "express";
import { getTerms } from "../controllers/contentController.js";

const router = express.Router();

// Public route to fetch terms
router.get("/terms", getTerms);

export default router;
