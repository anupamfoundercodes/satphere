// src/controllers/socialController.js
import { pool } from "../config/db.js";

export const getSocialLinks = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, link, status FROM social_links WHERE status='ACTIVE'");
    return res.json({
      success: true,
      message: "Social links fetched successfully",
      links: rows
    });
  } catch (err) {
    console.error("Get Social Links Error:", err);
    return res.status(200).json({ success: false, message: "Server error" ,links: rows});
  }
};

// import { pool } from "../config/db.js"; // agar aap mysql2 pool use kar rahe ho

export const getTermsConditions = async (req, res) => {
  try {
    const [results] = await pool.query(
      "SELECT * FROM terms_conditions WHERE status = 'active'"
    );

    if (results.length === 0) {
      return res.status(200).json({
        success: false,
        msg: "No data found",
        data: results,
      });
    }

    console.log("Query executed successfully");
    return res.status(200).json({
      success: true,
      msg: "Data fetched successfully",
      data: results,
    });
  } catch (err) {
    console.error("Get Terms & Conditions Error:", err);
    return res.status(200).json({ success: false, error: err.message });
  }
};

