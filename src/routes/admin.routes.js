import express from "express";
import { pool } from "../config/db.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { adminSignin, updatePassword} from "../controllers/adminController.js";



// const router = express.Router();
const base_url = process.env.BASE_URL;

// Helper to strip base64 header
function getBase64Data(base64String) {
  return base64String.replace(/^data:image\/\w+;base64,/, "");
}

const router = express.Router();
router.post("/signin", adminSignin);
router.post("/update-password", updatePassword);
// simple API test
router.get("/admin", (req, res) => {
  res.json({ success: true, message: "Admin API is working 🚀" });
});

// DB test
router.get("/db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS time");
    res.json({ success: true, dbTime: rows[0].time });
  } catch (error) {
    console.error(error);
    res.status(200).json({ success: false, error: "DB connection failed" });
  }
});


// 🔹 Update profile
router.post("/admin/updateprofile", async (req, res) => {
  try {
    const {
      id,
      name,
      phone,
      email,
      location,
      gender,
      dob,
      status,
      oldPassword,
      newPassword,
      profileImg,
      logoImg,
      qr_code,
      upi_id,
      ads_count
    } = req.body;

    if (!id) {
      return res.status(200).json({ success: false, message: "Admin ID is required" });
    }

    const updated_at = new Date();
    let profileImagePath = null;
    let logoImagePath = null;
    let qrCodePath = null;

    // Save profile image
    if (profileImg) {
      const buffer = Buffer.from(getBase64Data(profileImg), "base64");
      const imgPath = path.join(process.cwd(), "public/images/profile.jpg");
      fs.mkdirSync(path.dirname(imgPath), { recursive: true });
      fs.writeFileSync(imgPath, buffer);
      profileImagePath = `/images/profile.jpg`;
    }

    // Save logo image
    if (logoImg) {
      const buffer = Buffer.from(getBase64Data(logoImg), "base64");
      const logoPath = path.join(process.cwd(), "public/images/logo_.png");
      fs.mkdirSync(path.dirname(logoPath), { recursive: true });
      fs.writeFileSync(logoPath, buffer);
      logoImagePath = `/images/logo_.png`;
    }

    // Save QR code (always as qrcode.png)
// Backend
if (qr_code) {
  const buffer = Buffer.from(getBase64Data(qr_code), "base64");
  const qrPath = path.join(process.cwd(), "public/images/qrcode.png");
  fs.mkdirSync(path.dirname(qrPath), { recursive: true });
  fs.writeFileSync(qrPath, buffer);
  qrCodePath = `/images/qrcode.png`;
}


    // Start building query
    let updateQuery = `UPDATE admin SET updated_at = ?`;
    const params = [updated_at];

    if (name) {
      if (!/^[a-zA-Z\s]+$/.test(name)) return res.status(400).json({ success: false, message: "Invalid name" });
      updateQuery += `, name = ?`;
      params.push(name);
    }

    if (phone) {
      if (phone.length !== 10) return res.status(400).json({ success: false, message: "Invalid phone number" });
      updateQuery += `, phone = ?`;
      params.push(phone);
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: "Invalid email" });
      updateQuery += `, email = ?`;
      params.push(email);
    }

    if (location) {
      updateQuery += `, location = ?`;
      params.push(location);
    }

    if (gender) {
      const g = gender.toLowerCase();
      if (!["male", "female", "other"].includes(g)) {
        return res.status(400).json({ success: false, message: "Invalid gender" });
      }
      updateQuery += `, gender = ?`;
      params.push(g);
    }

    if (dob) {
      if (!/^\d{4}\-\d{2}\-\d{2}$/.test(dob)) {
        return res.status(200).json({ success: false, message: "Invalid DOB format (yyyy-mm-dd)" });
      }
      updateQuery += `, dob = ?`;
      params.push(dob);
    }

    if (status) {
      updateQuery += `, status = ?`;
      params.push(status);
    }

    if (upi_id) {
      updateQuery += `, upi_id = ?`;
      params.push(upi_id);
    }
    if (ads_count !== undefined) {
      const adsNumber = parseInt(ads_count);
      if (isNaN(adsNumber) || adsNumber < 0) {
       return res.status(400).json({ success: false, message: "Invalid Ads Count" });
      }
      updateQuery += `, ads_count = ?`;
     params.push(adsNumber);
    }


    if (profileImagePath) {
      updateQuery += `, img = ?`;
      params.push(profileImagePath);
    }

    if (logoImagePath) {
      updateQuery += `, logo = ?`;
      params.push(logoImagePath);
    }

    if (qrCodePath) {
      updateQuery += `, qr_code = ?`;
      params.push(qrCodePath);
    }

    // 🔹 Password change logic
    if (oldPassword && newPassword) {
      const [rows] = await pool.query("SELECT password FROM admin WHERE id = ?", [id]);
      if (!rows.length) return res.status(404).json({ success: false, message: "Admin not found" });

      const match = await bcrypt.compare(oldPassword, rows[0].password);
      if (!match) return res.status(200).json({ success: false, message: "Old password is incorrect" });

      const newHash = await bcrypt.hash(newPassword, 10);
      updateQuery += `, password = ?`;
      params.push(newHash);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    // 🔹 Run update query
    await pool.query(updateQuery, params);

    return res.status(200).json({ success: true, message: "Admin profile updated successfully" });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(200).json({ success: false, message: "Database error" });
  }
});


export default router;

