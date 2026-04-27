import express from "express";
import { sendOtpController, verifyOtpController, registerUseradmin,registerUser, loginUser, loginUserVerify } from "../controllers/authController.js";

import { manualDailyCoins } from "../cron/dailyCoins.js";
const router = express.Router();

// POST /api/users/register
router.post("/authregisteradmin", registerUseradmin);
// POST /api/users/register
router.post("/authregister", registerUser);
// POST /api/users/login
router.post("/authlogin", loginUser);

//Post/ api/auth/logingoogle
router.post("/authloginverify", loginUserVerify)

// Manual trigger endpoint
router.post("/run-daily-coins", manualDailyCoins);

// ✅ NEW OTP ROUTES
router.get("/send-otp", sendOtpController);
router.get("/verify-otp", verifyOtpController);

export default router;

