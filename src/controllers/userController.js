// src/controllers/userController.js
import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// Helper function to create JWT
const createToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );
};

// Validators
const isValidName = (name) => /^[A-Za-z\s]+$/.test(name);
const isValidLocation = (location) => /^[A-Za-z\s]+$/.test(location); // Only letters and spaces
const isAdult = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18;
};
const isValidDobFormat = (dob) => {
  // Must be YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dob)) return false;
  const [year, month, day] = dob.split("-").map(Number);
  const date = new Date(dob);
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
};
const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

const isValidPhone = (phone) => /^\d{10}$/.test(phone); // simple 10-digit validation
const isValidGender = (gender) => ["male", "female"].includes(gender.toLowerCase());

const isValidYear = (year) => {
  const currentYear = new Date().getFullYear();
  return /^\d{4}$/.test(year) && year >= 1900 && year <= currentYear;
};

const isValidIncome = (income) => {
  const regex =
    /^₹?\s*\d{1,3}(?:,\d{2,3})*(?:\.\d+)?\s*(K|k|L|l|CR|Cr|cr)?\s*(thousand|lakh|lac|crore)?(?:\s*[-–]\s*₹?\s*\d{1,3}(?:,\d{2,3})*(?:\.\d+)?\s*(K|k|L|l|CR|Cr|cr)?\s*(thousand|lakh|lac|crore)?)?$/;

  return true; // <-- validation off
};




// ✅ Use APP_URL from .env
const BASE_URL = process.env.APP_URL;  

// ---------------------- UPDATE PROFILE ----------------------
export const updateProfile = async (req, res) => {
  try {
    const {
      user_id,
      mobile_no,
      email,
      password,
      first_name,
      last_name,
      gender,
      dob,
      state,
      city,
      address,
      pincode,
      img,
      religion,
      sub_religion,
      profession,
      status,
      token
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const [existingUser] = await pool.query("SELECT id FROM users WHERE id = ?", [user_id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const fields = [];
    const values = [];

    if (mobile_no) {
      if (!isValidPhone(mobile_no)) return res.status(422).json({ message: "Invalid mobile number" });
      fields.push("mobile_no=?"); values.push(mobile_no);
    }

    if (email) {
      if (!isValidEmail(email)) return res.status(422).json({ message: "Invalid email" });
      fields.push("email=?"); values.push(email);
    }

    if (password) {
      fields.push("password=?"); values.push(password);
    }

    if (first_name) {
      if (!isValidName(first_name)) return res.status(422).json({ message: "Invalid first name" });
      fields.push("first_name=?"); values.push(first_name);
    }

    if (last_name) {
      if (!isValidName(last_name)) return res.status(422).json({ message: "Invalid last name" });
      fields.push("last_name=?"); values.push(last_name);
    }

    if (gender) {
      if (!isValidGender(gender)) return res.status(422).json({ message: "Invalid gender" });
      fields.push("gender=?"); values.push(gender);
    }

    if (dob) {
      if (!isValidDobFormat(dob)) return res.status(422).json({ message: "Invalid DOB format (YYYY-MM-DD)" });
      if (!isAdult(dob)) return res.status(422).json({ message: "User must be at least 18 years old" });
      fields.push("dob=?"); values.push(dob);
    }

    if (img) {
  const base64Regex = /^data:image\/(png|jpg|jpeg|gif);base64,/;

  if (!base64Regex.test(img)) {
    return res.status(422).json({ message: "Invalid img format" });
  }
}
    
    if (state && state !== "0") fields.push("state=?"), values.push(state);
    if (city && city !== "0") fields.push("city=?"), values.push(city);
    if (address) fields.push("address=?"), values.push(address);
    if (pincode) fields.push("pincode=?"), values.push(pincode);
    if (religion) fields.push("religion=?"), values.push(religion);
    if (sub_religion) fields.push("sub_religion=?"), values.push(sub_religion);
    if (profession) fields.push("profession=?"), values.push(profession);
    if (status) fields.push("status=?"), values.push(status);
    if (token) fields.push("token=?"), values.push(token);

// 🔹 Handle Image (Base64 or normal path)
	let imagePath = "/images/faces-clipart/profile.png";

	if (img && img.startsWith("data:image")) {
	  const base64Data = img.split(";base64,").pop();
	  const uploadDir = "./public/images/users";

	  // Ensure upload directory exists
	  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

	  // Use user_id instead of Date.now()
	  const filename = `user_${user_id}.png`;
	  const filePath = `${uploadDir}/${filename}`;

	  // Save base64 image to file
	  fs.writeFileSync(filePath, base64Data, { encoding: "base64" });

	  // Store relative path for database
	  imagePath = `/images/users/${filename}`;

	  fields.push("img=?");
	  values.push(imagePath);
	}


    if (fields.length === 0) {
      return res.status(400).json({ message: "No valid data provided to update" });
    }

    fields.push("updated_at=NOW()");
    values.push(user_id);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id=?`;
    await pool.query(query, values);

    res.status(200).json({ message: "Profile updated successfully" });

  } catch (err) {
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({     // ✅ 409 Conflict → for duplicate entries
     message: 'Mobile number or email already exists'
    });
  }

  res.status(500).json({               // ✅ 500 → internal server error (default)
    message: 'Error updating profile',
    error: err.message
  });
}
};

// ---------------------- UPDATE PROFILE ----------------------
export const updatePersonalDetails = async (req, res) => {
  try {
    const { user_id, caste, blood_group, residency_year, family_income, mother_name, father_name, any_disability } = req.body;

    if (!user_id) return res.status(400).json({ message: "User ID required" });

    const [exist] = await pool.query("SELECT id FROM users WHERE id=?", [user_id]);
    if (exist.length === 0) return res.status(404).json({ message: "User not found" });

    const fields = [];
    const values = [];

    if (caste) { if (!isValidName(caste)) return res.json({ message: "Invalid caste" }); fields.push("caste=?"); values.push(caste); }
    if (blood_group) { if (!/^(A|B|AB|O)[+-]$/.test(blood_group)) return res.json({ message: "Invalid blood group" }); fields.push("blood_group=?"); values.push(blood_group); }
    if (residency_year) { if (!isValidYear(residency_year)) return res.json({ message: "Invalid residency year" }); fields.push("residency_year=?"); values.push(residency_year); }
    if (family_income) { if (!isValidIncome(family_income)) return res.json({message: "Invalid family income" }); fields.push("family_income=?"); values.push(family_income); }
    if (mother_name) { if (!isValidName(mother_name)) return res.json({ message: "Invalid mother name" }); fields.push("mother_name=?"); values.push(mother_name); }
    if (father_name) { if (!isValidName(father_name)) return res.json({message: "Invalid father name" }); fields.push("father_name=?"); values.push(father_name); }
    if (any_disability) { fields.push("any_disability=?"); values.push(any_disability); }

    if (fields.length === 0) return res.json({message: "No valid data provided" });

    fields.push("updated_at=NOW()");
    values.push(user_id);

    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id=?`, values);
    res.json({ success: true, msg: "Personal details updated successfully" });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: "Duplicate entry", error: err.message });
    res.status(500).json({ message: "Error updating personal details", error: err.message });
  }
};

export const updateLifestyle = async (req, res) => {
  try {
    const { user_id, mangalik, about, hobbies,horoscopes, diet, height, skin_tone, brother_count, sister_count } = req.body;

    if (!user_id) return res.status(400).json({ message: "User ID required" });

    const [exist] = await pool.query("SELECT id FROM users WHERE id=?", [user_id]);
    if (exist.length === 0) return res.status(404).json({ message: "User not found" });

    const fields = [];
    const values = [];

    if (mangalik) { if (!["yes", "no"].includes(mangalik.toLowerCase())) return res.json({ message: "Invalid mangalik value" }); fields.push("mangalik=?"); values.push(mangalik); }
    if (about) { fields.push("about=?"); values.push(about); }
    if (hobbies) { fields.push("hobbies=?"); values.push(hobbies); }
    if (horoscopes) { fields.push("horoscopes=?"); values.push(horoscopes); }
    if (diet) { fields.push("diet=?"); values.push(diet); }
    if (height) { fields.push("height=?"); values.push(height); }
    if (skin_tone) { fields.push("skin_tone=?"); values.push(skin_tone); }
    if (brother_count !== undefined && !isNaN(brother_count)) { fields.push("brother_count=?"); values.push(brother_count); }
    if (sister_count !== undefined && !isNaN(sister_count)) { fields.push("sister_count=?"); values.push(sister_count); }

    if (fields.length === 0) return res.json({ message: "No valid data provided" });

    fields.push("updated_at=NOW()");
    values.push(user_id);

    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id=?`, values);
    res.json({message: "Lifestyle details updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating lifestyle details", error: err.message });
  }
};

export const updateProfessional = async (req, res) => {
  try {
    const { user_id, marital_status, child, highest_education, organization, course, work_type, company_name, income } = req.body;

    if (!user_id) return res.status(400).json({ message: "User ID required" });

    const [exist] = await pool.query("SELECT id FROM users WHERE id=?", [user_id]);
    if (exist.length === 0) return res.status(404).json({ message: "User not found" });

    const fields = [];
    const values = [];

    if (marital_status) { fields.push("marital_status=?"); values.push(marital_status); }
    if (child) { fields.push("child=?"); values.push(child); }
    if (highest_education) { fields.push("highest_education=?"); values.push(highest_education); }
    if (organization) { fields.push("organization=?"); values.push(organization); }
    if (course) { fields.push("course=?"); values.push(course); }
    if (work_type) { fields.push("work_type=?"); values.push(work_type); }
    if (company_name) { fields.push("company_name=?"); values.push(company_name); }
    if (income) { if (!isValidIncome(income)) return res.json({message: "Invalid income format" }); fields.push("income=?"); values.push(income); }

    if (fields.length === 0) return res.json({ message: "No valid data provided" });

    fields.push("updated_at=NOW()");
    values.push(user_id);

    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id=?`, values);
    res.json({ message: "Professional details updated successfully" });
  } catch (err) {
    res.status(500).json({message: "Error updating professional details", error: err.message });
  }
};


//--------------------UPDATE END-------------------------
export const updateProfilechange = async (req, res) => {
  try {
    const {
      id, email, match_count, game_count, phone, password, status,
      username, name, gender, dob, about, latitude, longitude,
      interests, profile_pic, cover_pic
    } = req.body;

    if (!id) return res.json({ message: "User ID is required" });

    const fields = [];
    const values = [];

    // Only update fields if they exist in request
    if (email) { fields.push("email=?"); values.push(email); }
    if (match_count !== undefined) { fields.push("match_count=?"); values.push(match_count); }
    if (game_count !== undefined) { fields.push("game_count=?"); values.push(game_count); }
    if (phone) { fields.push("phone=?"); values.push(phone); }
    if (password) { fields.push("password=?"); values.push(password); }
    if (status) { fields.push("status=?"); values.push(status); }
    if (username) { fields.push("username=?"); values.push(username); }
    if (name) { fields.push("name=?"); values.push(name); }
    if (gender) { fields.push("gender=?"); values.push(gender); }
    if (dob) { fields.push("dob=?"); values.push(dob); }
    if (about) { fields.push("about=?"); values.push(about); }
    if (latitude) { fields.push("latitude=?"); values.push(latitude); }
    if (longitude) { fields.push("longitude=?"); values.push(longitude); }
    if (interests) { fields.push("interests=?"); values.push(JSON.stringify(interests)); }

    // Save profile image if sent
    if (profile_pic) {
      const profileData = profile_pic.replace(/^data:image\/\w+;base64,/, "");
      const profilePath = `/images/users/user_profile_${id}.png`;
      fs.writeFileSync(path.join("public", profilePath), Buffer.from(profileData, "base64"));
      fields.push("profile_pic=?");
      values.push(profilePath);
    }

    // Save cover image if sent
    if (cover_pic) {
      const coverData = cover_pic.replace(/^data:image\/\w+;base64,/, "");
      const coverPath = `/images/users/user_cover_${id}.png`;
      fs.writeFileSync(path.join("public", coverPath), Buffer.from(coverData, "base64"));
      fields.push("cover_pic=?");
      values.push(coverPath);
    }

    if (fields.length === 0) {
      return res.json({ message: "No data provided to update" });
    }

    values.push(id); // For WHERE clause
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id=?`;

    await pool.query(query, values);

    res.json({ message: "Profile updated successfully" });

  } catch (err) {
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({     // ✅ 409 Conflict → for duplicate entries
      message: 'Mobile number or email already exists',
      error: err.message
    });
  }

  res.status(500).json({               // ✅ 500 → internal server error (default)
    message: 'Error updating profile',
    error: err.message
  });
}

};


export const updateProfile1 = async (req, res) => {
  const { userId, name, dob, horoscope, location, mood, about, online, ads_count } = req.body;
  console.log("login userid", userId);

  if (!userId) {
    return res.status(200).json({ success: false, message: "User ID is required", userId: null });
  }

  // DOB validation
  if (dob) {
    if (!isValidDobFormat(dob)) {
      return res.status(200).json({ success: false, message: "Invalid DOB format. Use YYYY-MM-DD" });
    }
    if (!isAdult(dob)) {
      return res.status(200).json({ success: false, message: "User must be at least 18 years old" });
    }
  }

  // Name validation
  if (name && !isValidName(name)) {
    return res.status(200).json({ success: false, message: "Name must contain only letters and spaces" });
  }

  // Location validation
  if (location) {
    if (!isValidLocation(location)) {
      return res.status(200).json({ success: false, message: "Location must contain only letters and spaces" });
    }
    if (location.length > 40) {
      return res.status(200).json({ success: false, message: "Location must not exceed 40 characters" });
    }
  }

  // About validation
  if (about && about.length > 200) {
    return res.status(200).json({ success: false, message: "About must not exceed 200 characters" });
  }

  try {
    const fields = [];
    const values = [];

    if (name) fields.push("username = ?") && values.push(name);
    if (dob) fields.push("dob = ?") && values.push(dob);
    if (horoscope) fields.push("horoscope = ?") && values.push(horoscope);
    if (location) fields.push("location = ?") && values.push(location);
    if (mood) fields.push("mood = ?") && values.push(mood);
    if (about) fields.push("about = ?") && values.push(about);
    if (ads_count !== undefined) fields.push("ads_count = ?") && values.push(ads_count);
    if (online !== undefined) {
      if (online == 0 || online == 1) {
        fields.push("online = ?");
        values.push(online);
      } else {
        return res.status(200).json({ success: false, message: "Invalid value for online. Only 0 or 1 allowed." });
      }
    }

    if (fields.length === 0) {
      return res.status(200).json({message: "No fields to update", userId });
    }

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    values.push(userId);

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(200).json({ message: "User not found", userId });
    }

    return res.status(200).json({message: "Updated successfully", userId });
  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(200).json({ message: "Server error", userId });
  }
};

// ---------------------- GET PROFILE ----------------------
// 🔹 Helper to calculate profile completion percentage
const calculateProfileCompletion = (user) => {
  // Exclude non-profile columns (like id, created_at, updated_at)
  const excludeFields = ["id", "created_at", "updated_at", "password", "token"];
  
  // Get all keys from user
  const totalFields = Object.keys(user).filter((key) => !excludeFields.includes(key));
  const filledFields = totalFields.filter((key) => {
    const value = user[key];
    return value !== null && value !== "";
  });

  // Calculate %
  const percentage = Math.round((filledFields.length / totalFields.length) * 100);
  return percentage;
};


export const getProfile = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      message: "User ID is required",
      user: null,
    });
  }

  try {
    // 1️⃣ Fetch user basic details
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
      message: "User not found",
        user: null,
      });
    }

    let user = rows[0];

    // ✅ Format DOB as YYYY-MM-DD
    if (user.dob) {
      user.dob = new Date(user.dob).toISOString().split("T")[0];
    }

    if (user.img && !user.img.startsWith("http")) {
     user.img = `${BASE_URL}/${user.img.replace(/^\/+/, "")}`;
    }

    // 2️⃣ Check if user has active premium plan
    const [plans] = await pool.query(
      `SELECT plan_id 
       FROM payments 
       WHERE user_id = ? 
         AND status = 'success' 
         AND expire_at > NOW()`,
      [userId]
    );

    //  Set premium flag
    const isPremium = plans.length > 0 ? 1 : 0;

    //  Add premium parameter (0 or 1)
    user.premium = isPremium;

       // 3️⃣ Calculate profile completion
    const profileCompletion = calculateProfileCompletion(user);
    user.profile = profileCompletion; // Add % to response

    //  Return response
    return res.status(200).json({
      message: "Profile fetched successfully",
      user: user,
    });

  } catch (err) {
    console.error("Get Profile Error:", err);
    return res.status(500).json({
      message: "Server error",
      user: null,
    });
  }
};


// ---------------------- GET PROFILE OTHERS----------------------
export const getProfileother = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      message: "User ID is required",
      user: null,
    });
  }

  try {
    // 1️⃣ Fetch user basic details
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
        user: null,
      });
    }

    let user = rows[0];

    // ✅ Format DOB as YYYY-MM-DD
    if (user.dob) {
      user.dob = new Date(user.dob).toISOString().split("T")[0];
    }

    // 2️⃣ Check if user has active premium plan
    const [plans] = await pool.query(
      `SELECT plan_id 
       FROM payments 
       WHERE user_id = ? 
         AND status = 'success' 
         AND expire_at > NOW()`,
      [userId]
    );

    //  Set premium flag
    const isPremium = plans.length > 0 ? 1 : 0;

    //  Add premium parameter (0 or 1)
    user.premium = isPremium;

    // 3️⃣ Calculate profile completion
    const profileCompletion = calculateProfileCompletion(user);
    user.profile = profileCompletion; // Add % to response
    //  Return response
    return res.status(200).json({
      message: "Profile fetched successfully",
      user: user,
    });

  } catch (err) {
    console.error("Get Profile Error:", err);
    return res.status(500).json({
      message: "Server error",
      user: null,
    });
  }
};

// ---------------------- UPDATE ONLINE STATUS ----------------------

export const updateOnlineStatus = async (req, res) => {
  const { user_id, online_status } = req.body;

  // Validation
  if (!user_id) {
    return res.status(400).json({  message: "UserId is required" });
  }

  if (online_status === undefined) {
    return res.status(400).json({ message: "online_status is required (0 or 1)" });
  }

  if (online_status !== 0 && online_status !== 1 && online_status !== "0" && online_status !== "1") {
    return res.status(400).json({ message: "Online value must be 0 or 1" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE users SET online_status = ? WHERE id = ?",
      [online_status, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: online_status == 1 ? "User is online" : "User is offline",
      online_status: Number(online_status)
    });

  } catch (err) {
    console.error("Update Online Status Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateLiveStatus = async (req, res) => {
  const { user_id, live_status } = req.body;

  // Validation
  if (!user_id) {
    return res.status(400).json({ message: "UserId is required" });
  }

  if (live_status === undefined) {
    return res.status(400).json({ message: "live_status is required (0 or 1)" });
  }

  if (live_status !== 0 && live_status !== 1 && live_status !== "0" && live_status !== "1") {
    return res.status(400).json({ message: "Live value must be 0 or 1" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE users SET live_status = ? WHERE id = ?",
      [live_status, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: live_status == 1 ? "User is live" : "User is not live",
      live_status: Number(live_status)
    });

  } catch (err) {
    console.error("Update Live Status Error:", err);
    return res.status(500).json({message: "Server error", error: err.message });
  }
};

export const updatEarning = async (req, res) => {
  let { user_id, earning_status } = req.body;
 earning_status = earning_status === true ? 1 : 0;
 
  // Validation
  if (!user_id) {
    return res.status(400).json({ message: "UserId is required" });
  }

  if (earning_status === undefined) {
    return res.status(400).json({  message: "earning_status is required (0 or 1)" });
  }

  if (earning_status !== 0 && earning_status !== 1 && earning_status !== "0" && earning_status !== "1") {
    return res.status(400).json({ message: "Earning value must be 0 or 1" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE users SET earning_status = ? WHERE id = ?",
      [earning_status, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: earning_status == 1 ? "Paid profile view has been enabled." : "Paid profile view has been disabled.",
      earning_status: Number(earning_status)
    });

  } catch (err) {
    console.error("Update Online Status Error:", err);
    return res.status(500).json({message: "Server error", error: err.message });
  }
};
// Update user's latitude and longitude
export const updateUserLocation = async (req, res) => {
  try {
    const { user_id, latitude, longitude } = req.body;

    if (!user_id || !latitude || !longitude) {
      return res.status(400).json({
        message: "user_id, latitude and longitude are required",
      });
    }

    // Check if user exists
    const [userRows] = await pool.query(
      "SELECT id FROM users WHERE id = ?",
      [user_id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Update latitude & longitude
    await pool.query(
      "UPDATE users SET latitude = ?, longitude = ?, updated_at = NOW() WHERE id = ?",
      [latitude, longitude, user_id]
    );

    return res.status(200).json({
      message: "User location updated successfully",
      data: { user_id, latitude, longitude },
    });

  } catch (err) {
    console.error("Update Location API Error:", err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateInterestStatus = async (req, res) => {
  const { user_id, interests } = req.body;

  // ------------------- Validation -------------------
  if (!user_id) {
    return res.status(200).json({ message: "UserId is required" });
  }

  if (!Array.isArray(interests) || interests.length === 0) {
    return res.status(200).json({  message: "interests must be a non-empty array" });
  }

  // Allowed interests
  const allowedInterests = ["dating", "video", "social", "game"];
  const invalidInterests = interests.filter(i => !allowedInterests.includes(i));

  if (invalidInterests.length > 0) {
    return res.status(200).json({ 
      message: `Invalid interests: ${invalidInterests.join(", ")}` 
    });
  }

  try {
    // Convert array to JSON string for storing in DB
    const interestsJson = JSON.stringify(interests);

    const [result] = await pool.query(
      "UPDATE users SET interests = ? WHERE id = ?",
      [interestsJson, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(200).json({ message: "User not found" });
    }

    // ------------------- Response -------------------
    // Return array as string values (not JSON string)
    const interestsString = interests.join(",");
    return res.status(200).json({
      message: "Interests updated successfully",
      interests: interestsString  // ["dating"] or ["dating","video"] etc
    });

  } catch (err) {
    console.error("Update Interest Error:", err);
    return res.status(500).json({message: "Server error", error: err.message });
  }
};


