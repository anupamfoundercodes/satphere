// src/routes/social.routes.js
import express from "express";
import { getSocialLinks ,getTermsConditions} from "../controllers/socialController.js";

const router = express.Router();

// GET /api/social-links
router.get("/social-links", getSocialLinks);
router.get("/terms_conditions", getTermsConditions);

export default router;
