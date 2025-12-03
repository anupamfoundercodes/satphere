import express from "express";
import { matchMaking } from "../controllers/astrologyController.js";

const router = express.Router();

// 🚀 Match Making API
router.post("/matchmaking", matchMaking);

export default router;
