import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";   // pool import

export const adminSignin = async (req, res) => {
  const { email, password } = req.body;
//   console.log("Email received:", email);
// console.log("password:", password);

  try {
    const [results] = await pool.query(
      "SELECT * FROM admin WHERE email = ?",
      [email]
    );

    if (!results || results.length === 0) {
      return res.render("login", { alertMessage: "Invalid Email" });
    }
    
    // console.log("Signin email:", email);
    // console.log("Signin password:", password);
    // console.log("DB result:", results);

    const admin = results[0];

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render("login", { alertMessage: "Invalid Credential" });
    }

    const token = jwt.sign(
      { id: admin.id },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    res.cookie("token", token, { httpOnly: true });
    return res.redirect("/");
  } catch (err) {
    console.error("Signin DB Error:", err);
    return res.status(500).json({ success: false, msg: "Database error" });
  }
};

// Update password by email
export const updatePassword = async (req, res) => {
  const { email, newPassword } = req.body;
    console.log("Email received:", email);
  console.log("Password received:", newPassword);

  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Email and newPassword are required",
    });
  }

  try {
    // check if user exists
    const [results] = await pool.query(
      "SELECT * FROM admin WHERE email = ?",
      [email]
    );

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update password
    await pool.query(
      "UPDATE admin SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};