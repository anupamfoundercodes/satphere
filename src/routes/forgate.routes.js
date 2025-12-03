import express from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { pool } from "../config/db.js";
import { otpsend,otpverify,changePassword,verifyotpsend,emailverify } from "../controllers/forgetController.js";
const router = express.Router();

// Environment variables
const MAIL_USER = process.env.MAIL_USER;        // e.g. kvsbandhan@gmail.com
const MAIL_APP_PASS = process.env.MAIL_APP_PASS; // 16-char App Password from Google

if (!MAIL_USER || !MAIL_APP_PASS) {
  console.warn("⚠️ Warning: MAIL_USER or MAIL_APP_PASS not set. Forgot-password emails will fail.");
}

// Create transporter for Gmail (App Password)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_APP_PASS,
  },
});

// Verify transporter once
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Nodemailer verify failed:", err.message || err);
  } else {
    console.log("✅ Nodemailer ready to send emails");
  }
});


// POST /forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    console.log(req.body);

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Find admin user
    const [rows] = await pool.query("SELECT * FROM admin WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }

    const adminUser = rows[0];

    // Generate random 8-character password
    const randomPassword = Math.random().toString(36).slice(-8);
    console.log("Generated Password:", randomPassword);

    // Hash and update the password
    const hashed = await bcrypt.hash(randomPassword, 10);
    await pool.query("UPDATE admin SET password = ? WHERE email = ?", [
      hashed,
      email,
    ]);

    // Prepare email
    const mailOptions = {
      from: MAIL_USER,
      to: email,
      subject: "Your New Password - Admin",
      text: `
Hello ${adminUser.name || ""},

A password reset was requested for your account.
Your new temporary password is:

    ${randomPassword}

Please log in and change your password immediately.

If you did not request this reset, please contact support.

Regards,
Satphere
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "New password sent to your email",
    });
  } catch (err) {
    console.error("Error in /forgot-password:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});
router.post("/otpSend",otpsend);
router.post("/otpVerify",otpverify);
router.post("/changePassword", changePassword);
router.post("/emailOtpSend",verifyotpsend);
router.post("/emailOtpVerify",emailverify);
export default router;
