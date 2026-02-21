import express from "express";
import { registerUseradmin,registerUser, loginUser, loginUserVerify } from "../controllers/authController.js";
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
router.post("/send_otp", sendOtpController);
router.post("/verify_otp", verifyOtpController);

export default router;

