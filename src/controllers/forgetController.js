import { pool } from "../config/db.js";
import nodemailer from "nodemailer";

// Environment variables
const MAIL_USER = process.env.MAIL_USER;
const MAIL_APP_PASS = process.env.MAIL_APP_PASS;

if (!MAIL_USER || !MAIL_APP_PASS) {
  console.warn("⚠️ Warning: MAIL_USER or MAIL_APP_PASS not set. OTP emails will fail.");
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
    console.log("✅ Nodemailer ready to send OTP emails");
  }
});

export const otpsend = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    // Find user
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    const user = rows[0];

    // Generate 4-digit OTP
const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store OTP in password column temporarily
    await pool.query("UPDATE users SET password = ? WHERE email = ?", [otp, email]);

    // Prepare email
    const mailOptions = {
      from: MAIL_USER,
      to: email,
      subject: "Your OTP for Forget",
      text: `
Hello ${user.name || ""},

You requested a password reset or login via OTP.

Your One-Time Password (OTP) is:

    ${otp}

It is valid for a short time. Do not share this OTP with anyone.

Regards,
Honey With Moon
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "OTP sent to your email" });

  } catch (error) {
    console.error("Error in otpsend:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const otpverify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    // Fetch user by email
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    const user = rows[0];

    // Check if OTP matches
    if (user.password !== otp) {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    // OTP verified
    return res.status(200).json({ success: true, message: "OTP verified successfully" });

  } catch (error) {
    console.error("OTP Verify Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { email, new_password } = req.body;

    if (!email || !new_password) {
      return res.status(400).json({ success: false, message: "Email and new password are required" });
    }

    // Check if user exists
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update password in plain text
    await pool.query("UPDATE users SET password = ? WHERE email = ?", [new_password, email]);

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};



export const verifyotpsend = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log("otp",otp);
    const created_at = new Date();

    // Upsert OTP in email_verifications table
    await pool.query(
      `INSERT INTO email_verifications (email, otp, created_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), created_at = VALUES(created_at)`,
      [email, otp, created_at]
    );

    // Send OTP email
    const mailOptions = {
      from: MAIL_USER,
      to: email,
      subject: "Your OTP for Email Verification",
      text: `Hello,

Your One-Time Password (OTP) for email verification is:

    ${otp}

It is valid for a short time. Do not share this OTP with anyone.

Regards,
Honey With Moon`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "OTP sent to your email" });

  } catch (error) {
    console.error("Email OTP Send Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const emailverify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(200).json({ success: false, message: "Email and OTP are required" });
    }

    // Fetch OTP record
    const [rows] = await pool.query("SELECT * FROM email_verifications WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(200).json({ success: false, message: "OTP not found, please request again" });
    }

    const record = rows[0];

    // Optional: Check expiry (e.g., 10 minutes)
    const expiryMinutes = 10;
    const now = new Date();
    if ((now - new Date(record.created_at)) / 1000 / 60 > expiryMinutes) {
      return res.status(200).json({ success: false, message: "OTP expired, please request a new one" });
    }

    // Verify OTP
    if (record.otp !== otp) {
      return res.status(200).json({ success: false, message: "Invalid OTP" });
    }

    // Mark as verified
    await pool.query("UPDATE email_verifications SET otp = '' WHERE email = ?", [email]);

    res.status(200).json({ success: true, message: "Email verified successfully" });

  } catch (error) {
    console.error("Email OTP Verify Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


