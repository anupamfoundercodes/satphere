import { pool } from "../config/db.js";

export const getHoroscopes = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name FROM horoscopes ORDER BY id ASC");
    return res.json({ success: true, horoscopes: rows });
  } catch (err) {
    console.error("Get Horoscope List Error:", err);
    return res.status(200).json({ success: false, message: "Server error" });
  }
};

// src/controllers/listController.js
// import { pool } from "../config/db.js";

export const getList = async (req, res) => {
  const { type } = req.query;

  if (!type) {
    return res.status(200).json({ success: false, message: "Type is required" });
  }

  let query = "";
  if (type == 1) {
    query = "SELECT id, name, title FROM horoscopes ORDER BY id ASC";
  } else if (type == 2) {
    query = "SELECT id, name, title FROM regions ORDER BY id ASC";
  } else {
    return res.status(200).json({ success: false, message: "Invalid type" });
  }

  try {
    const [rows] = await pool.query(query);
    if (rows.length === 0) {
      return res.status(200).json({ success: false, message: "No data found", data: [] });
    }

    return res.status(200).json({ success: true, message: "Data fetched successfully", data: rows });
  } catch (err) {
    console.error("Get List Error:", err);
    return res.status(200).json({ success: false, message: "Server error", error: err.message });
  }
};

