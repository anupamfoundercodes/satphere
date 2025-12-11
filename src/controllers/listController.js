// src/controllers/listController.js
import { pool } from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.APP_URL;

// ✅ GET all banners
export const getBanners = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, img_url, uploaded_at, status, action_link FROM banner ORDER BY id DESC"
    );

    // Base URL add karein
    const banners = rows.map((b) => ({
      id: b.id,
      img_url: `${BASE_URL}${b.img_url}`,
      uploaded_at: b.uploaded_at,
      status: b.status,
      action_link: b.action_link,
    }));

    res.status(200).json({
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({
      message: "Server error while fetching banners",
    });
  }
};


export const getStatesLinks = async (req, res) => {
  try {
    // 🔹 Fetch all states from country_id = 101
    const [states] = await pool.query(`SELECT id, state as name FROM state WHERE status = 'active'`);
    
    // 🔹 Fetch all religions
    const [religions] = await pool.query(`SELECT * FROM religion`);

    // ✅ If both tables empty
    if ((!states || states.length === 0) && (!religions || religions.length === 0)) {
      return res.status(404).json({
        message: "No data found for states or religions",
        data: {
          states: [],
          religions: []
        }
      });
    }

    // ✅ Success
    return res.status(200).json({
      message: "States and religions fetched successfully",
      data: {
        states,
        religions
      }
    });

  } catch (err) {
    console.error("❌ getStatesLinks Error:", err);
    return res.status(500).json({
      message: "Server error while fetching states and religions",
      error: err.message
    });
  }
};


// 🆕 New API: Get Cities by State ID
export const getDistrictByState = async (req, res) => {
  try {
    const { state_id } = req.body;

    // Validation
    if (!state_id) {
      return res.status(400).json({
        message: "state_id is required"
      });
    }

    // Query cities table
    const [rows] = await pool.query(
      `SELECT id, district_name As name, state_id FROM district WHERE state_id = ? AND status = 'active'`,
      [state_id]
    );

    return res.status(200).json({
      message: "District fetched successfully",
      cities: rows
    });
  } catch (err) {
    console.error("Get District Error:", err);
    return res.status(500).json({
      message: "Server error",
      cities: []
    });
  }
};
//------------------------------------
// 🆕 New API: Get Sub Religion by Religion ID
export const getSubReligionByReligion = async (req, res) => {
  try {
    const { religion_id } = req.body;

    // 🔹 Validation
    if (!religion_id) {
      return res.status(400).json({
        message: "religion_id is required"
      });
    }

    // 🔹 Query sub_religion table
    const [rows] = await pool.query(
      `SELECT * FROM sub_religion WHERE religion_id = ? AND  status = 'active'`,
      [religion_id]
    );

    // 🔹 If no data found
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        message: "No sub religions found for this religion_id",
        sub_religions: []
      });
    }

    // 🔹 Success response
    return res.status(200).json({
      message: "Sub religions fetched successfully",
      sub_religions: rows
    });
  } catch (err) {
    console.error("Get Sub Religion Error:", err);
    return res.status(500).json({
      message: "Server error while fetching sub religions",
      sub_religions: []
    });
  }
};

//-----------------------profile------------------
export const getPersonalList = async (req, res) => {
  try {
    // 🔹 Fetch all three tables in parallel for better performance
    const [horoscopes, skinTones, heights, diets,lists] = await Promise.all([
      pool.query("SELECT * FROM horoscopes"),
      pool.query("SELECT * FROM skin_tones"),
      pool.query("SELECT * FROM height"),
      pool.query("SELECT * FROM diet"),
      pool.query("SHOW CREATE TABLE payments")
    ]);

    // ✅ Return structured response
    return res.status(200).json({
      message: "Get Professional List fetched successfully",
      data: {
        horoscopes: horoscopes[0],
        skin_tones: skinTones[0],
        height: heights[0],
        diet: diets[0],
        lists: lists[0]
      }
    });

  } catch (error) {
    console.error("Error fetching profile options:", error);
    return res.status(500).json({
      message: "Server error while fetching profile options",
      error: error.message
    });
  }
};


//--------personal list---------------
// ✅ GET all master data (blood group, disability, income, years)
export const getFemilyList = async (req, res) => {
  try {
    const [bloodGroups] = await pool.query("SELECT * FROM blood_groups ORDER BY id ASC");
    const [disabilityTypes] = await pool.query("SELECT * FROM disability_types ORDER BY id ASC");
    const [incomeRanges] = await pool.query("SELECT * FROM income_list ORDER BY id ASC");
    const [years] = await pool.query("SELECT * FROM years ORDER BY id ASC");

    return res.status(200).json({
      message: "Master data fetched successfully",
      data: {
        blood_groups: bloodGroups,
        disability_types: disabilityTypes,
        income: incomeRanges,
        years: years,
      },
    });
  }catch (error) {
  console.error("Get Master Data Error:", error.message);

  return res.status(500).json({
    message: "Server error while fetching master data",
    error: error.message
  });
}

};

export const getProfessionalList = async (req, res) => {
  try {
    const [
      [marital_status],
      [child_count],
      [qualification_list],
      [university],
      [work_type],
      [income_list]
    ] = await Promise.all([
      pool.query("SELECT * FROM marital_status"),
      pool.query("SELECT * FROM child_count"),
      pool.query("SELECT * FROM qualification_list"),
      pool.query("SELECT * FROM university"),
      pool.query("SELECT * FROM work_type"),
      pool.query("SELECT * FROM income_list")
    ]);

    return res.status(200).json({
      message: "Master data fetched successfully",
      data: {
        marital_status,
        child_count,
        qualification_list,
        university,
        work_type,
        income_list
      }
    });

  } catch (error) {
    console.error("Get Master Data Error:", error.message);
    return res.status(500).json({
      message: "Server error while fetching master data",
      error: error.message
    });
  }
};


