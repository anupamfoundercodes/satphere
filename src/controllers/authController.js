// src/controllers/userController.js
import { pool } from "../config/db.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import moment from "moment-timezone";
import axios from "axios";
import fs from "fs";

const created_at = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
dotenv.config();

// Helper function to create JWT
const createToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );
};

//  Helper function: validate name
//  Helper function: validate name
const isValidName = (name) => /^[A-Za-z\s-]+$/.test(name);

//  Helper function: check age >= 18
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

//  DOB format checker
const isValidDobFormat = (dob) => {
  // Must be YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dob)) return false;

  // Check if actual valid date
  const [year, month, day] = dob.split("-").map(Number);
  const date = new Date(dob);
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
};

function isValidPassword(password) {
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

// ✅ Email helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[6-9]\d{9}$/;  
  return phoneRegex.test(phone);
}

function isValidGender(gender) {
  const allowedGenders = ["male", "female", "other"];
  return allowedGenders.includes(gender.toLowerCase());
}



function generateReferralCode(userId) {
  return "REF" + userId + crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. REF1A2B3C
}



export async function updateUserCount(userId, columnName, type) {
  const validColumns = ["game_count", "match_count", "video_count", "invite_count"];
  if (!validColumns.includes(columnName)) {
    throw new Error("Invalid column name");
  }

  const [rows] = await pool.query(`SELECT ${columnName} FROM users WHERE id = ?`, [userId]);
  if (rows.length === 0) throw new Error("User not found");

  let currentValue = rows[0][columnName] || 0;

  if (type === 1) {
    currentValue += 1;
  } else if (type === 0) {
    currentValue = currentValue > 0 ? currentValue - 1 : 0;
  } else {
    throw new Error("Type must be 0 or 1");
  }

  await pool.query(`UPDATE users SET ${columnName} = ? WHERE id = ?`, [currentValue, userId]);
  return currentValue;
}


//await updateUserCount(user_id, "video_count", 1); // increment
//await updateUserCount(user_id, "invite_count", 0); // decrement (but not below 0)
//------------------------------register---------------------------------------------------------------


export const sendOtpController = async (req, res) => {
  try {

    /* ✅ GET params */
    const {
      mobile,
      digit = 4,
      merchant_key = "09757d9dc5dc30b49b4d7ae6ac183ccfd1a353c546d5134c"
    } = req.query;

    /* validation */
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        status: false,
        message: "Valid mobile number required"
      });
    }

    /* provider API */
    const url =
      `https://indopay.cloud/otp/newsend_otp.php?merchant_key=${merchant_key}&digit=${digit}&mobile_no=${mobile}`;

    const response = await axios.get(url);
    const data = response.data;

    if (!data || !data.otp) {
      return res.status(400).json({
        status: false,
        message: "OTP provider failed"
      });
    }

    /* expiry 5 minutes */
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    /* invalidate old OTP */
await pool.query(
  "UPDATE otp_logs SET is_verified=1 WHERE mobile=? AND is_verified=0",
  [mobile]
);

await pool.query(
  `INSERT INTO otp_logs
   (mobile, otp, merchant_key, provider_mode, expires_at)
   VALUES (?,?,?,?,?)`,
  [
    mobile,
    String(data.otp),
    merchant_key,
    data.mode || "api",
    expiry
  ]
);

    return res.status(200).json({
      status: true,
      message: "OTP sent successfully",
      data
    });

  } catch (error) {

    console.error("Send OTP Error:", error.message);

    return res.status(500).json({
      status: false,
      message: "Failed to send OTP",
      error: error.message
    });
  }
};

export const verifyOtpController = async (req, res) => {
  try {

    const { mobile, otp } = req.query;

    if (!mobile || !otp) {
      return res.status(400).json({
        status: false,
        message: "Mobile and OTP required"
      });
    }

    /* ✅ TEST NUMBERS (bypass) */
    const testNumbers = ["9876543210", "9876543211"];

    if (testNumbers.includes(mobile) && otp === "1111") {
      return res.status(200).json({
        status: true,
        message: "OTP verified successfully (TEST MODE)",
        data: {
          mobile,
          otp,
          verified: true
        }
      });
    }

    // ✅ DB se latest OTP check
    const [rows] = await pool.query(
      `SELECT * FROM otp_logs
       WHERE mobile=? AND otp=? AND is_verified=0
       ORDER BY id DESC LIMIT 1`,
      [mobile, otp]
    );

    if (!rows.length) {
      return res.status(200).json({
        status: false,
        message: "Invalid OTP"
      });
    }

    const record = rows[0];

    // ✅ expiry check
    if (new Date() > new Date(record.expires_at)) {
      return res.status(200).json({
        status: false,
        message: "OTP expired"
      });
    }

    // ✅ mark verified
    await pool.query(
      "UPDATE otp_logs SET is_verified=1 WHERE id=?",
      [record.id]
    );

    // ✅ SUCCESS RESPONSE
    return res.status(200).json({
      status: true,
      message: "OTP verified successfully",
      data: {
        mobile,
        otp,
        verified: true
      }
    });

  } catch (error) {

    console.error("Verify OTP Error:", error.message);

    return res.status(500).json({
      status: false,
      message: "OTP verification failed",
      error: error.message
    });

  }
};
/*export const verifyOtpController = async (req, res) => {

  try {

    const { mobile, otp } = req.query;

    if (!mobile || !otp) {
      return res.status(400).json({
        status: false,
        message: "Mobile and OTP required"
      });
    }

    // ✅ check DB OTP
    const [rows] = await db.promise().query(
      `SELECT * FROM otp_logs
       WHERE mobile=? AND otp=? AND is_verified=0
       ORDER BY id DESC LIMIT 1`,
      [mobile, otp]
    );

    if (!rows.length) {
      return res.status(200).json({
        status: false,
        message: "Invalid OTP"
      });
    }

    const record = rows[0];

    // expiry check
    if (new Date() > new Date(record.expires_at)) {
      return res.status(200).json({
        status: false,
        message: "OTP expired"
      });
    }

    // ✅ provider verify API
    const url =
      `https://indopay.cloud/otp/verifyotp.php?merchant_key=${record.merchant_key}&mobile=${mobile}&otp=${otp}`;

    const response = await axios.get(url);

    // ✅ mark verified
    await db.promise().query(
      "UPDATE otp_logs SET is_verified=1 WHERE id=?",
      [record.id]
    );

    // RESPONSE SAME
    return res.status(200).json({
      status: true,
      message: "OTP verification result",
      data: response.data
    });

  } catch (error) {

    console.error("Verify OTP Error:", error.message);

    return res.status(500).json({
      status: false,
      message: "OTP verification failed",
      error: error.message
    });

  }
};*/


/*export const verifyOtpController = async (req, res) => {

  try {

    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        status: false,
        message: "Mobile and OTP required"
      });
    }

    const url = `https://indopay.cloud/otp/verifyotp.php?mobile=${mobile}&otp=${otp}`;

    const response = await axios.get(url);

    return res.status(200).json({
      status: true,
      message: "OTP verification result",
      data: response.data
    });

  } catch (error) {

    console.error("Verify OTP Error:", error.message);

    return res.status(500).json({
      status: false,
      message: "OTP verification failed",
      error: error.message
    });

  }

};*/

// ✅ Full User Registration API (Admin)


export const registerUseradmin = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      gender,
      dob,
      mobile_no,
      email,
      state,
      city,
      address,
      pincode,
      img,
      religion,
      sub_religion,
      profession,
      token,
    } = req.body;

    // ===============================
    // 🔹 1. Validate required fields
    // ===============================
    if (!first_name || !last_name || !mobile_no || !email) {
      return res.status(400).json({
        message:
          "Please fill all required fields: First name, Last name, Email, and Mobile number.",
      });
    }
    if (!img) {
      return res.status(400).json({
        message:
          "Please fill all required fields: Image.",
      });
    }

    // 🔹 Name validation
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(first_name.trim()) || !nameRegex.test(last_name.trim())) {
      return res.status(400).json({
        message: "Names must contain only letters.",
      });
    }

    // 🔹 Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    // 🔹 Mobile validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(mobile_no)) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit Indian mobile number.",
      });
    }

    // 🔹 Pincode validation
    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        message: "Please enter a valid 6-digit pincode.",
      });
    }

    // 🔹 DOB validation
    if (dob && isNaN(new Date(dob).getTime())) {
      return res.status(400).json({
        message: "Please enter a valid date of birth.",
      });
    }

    // ===============================
    // 🔹 2. Check duplicate user
    // ===============================
    const [existingUser] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR mobile_no = ?",
      [email, mobile_no]
    );

    if (existingUser.length > 0) {
      return res.status(200).json({
        message: "User already exists with this email or mobile number.",
      });
    }

    // ===============================
    // 🔹 3. Handle image saving
    // ===============================
    let finalImg = "/images/faces-clipart/profile.png"; // default image path

    if (img && img.startsWith("data:image/")) {
      // Extract image extension
      const ext = img.substring("data:image/".length, img.indexOf(";"));
      const base64Data = img.split(",")[1];

      // Unique filename
      const filename = `user_profile_${Date.now()}.${ext}`;
      const savePath = path.join("public", "images", "users", filename);

      // Ensure folder exists
      fs.mkdirSync(path.dirname(savePath), { recursive: true });

      // Save the file to disk
      fs.writeFileSync(savePath, Buffer.from(base64Data, "base64"));

      // Save path for database
      finalImg = `/images/users/${filename}`;
    }

    // ===============================
    // 🔹 4. Insert new user
    // ===============================
    const [result] = await pool.query(
      `INSERT INTO users 
        (first_name, last_name, gender, dob, mobile_no, email, state, city, address, pincode, img, religion, sub_religion, profession, status, token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        first_name.trim(),
        last_name.trim(),
        gender || "",
        dob || null,
        mobile_no.trim(),
        email.trim().toLowerCase(),
        state || "",
        city || "",
        address || "",
        pincode || "",
        finalImg,
        religion || "",
        sub_religion || "",
        profession || "",
        token || "",
      ]
    );

    // ===============================
    // 🔹 5. Success response
    // ===============================
    return res.status(200).json({
      message: "User registered successfully!",
      user_id: result.insertId,
      image_path: finalImg,
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};



// ✅ Register User
export const registerUser = async (req, res) => {
  const {
    first_name,
    last_name,
    gender,
    dob,
    mobile_no,
    email,
    password,
    state,
    city,
    address,
    pincode,
    img,
religion,
 sub_religion,
 profession,
    token,
  } = req.body;
   if (!img) {
      return res.status(400).json({
        message:
          "Please Select Profile Image.",
      });
    }
  try {
    // 🔹 IF USER TABLE EMPTY → Create first user from admin
    const [userCount] = await pool.query("SELECT COUNT(*) AS count FROM users");
    if (userCount[0].count === 0) {
      const [adminRow] = await pool.query("SELECT email, phone FROM admin ORDER BY id ASC LIMIT 1");
      if (adminRow.length === 0)
        return res
          .status(200)
          .json({  message: "No admin found to create first user." });

      const [result] = await pool.query(
        `INSERT INTO users
        (mobile_no, email, password, first_name, last_name, gender, dob, state, city, address, pincode, img,religion,sub_religion,
		profession, status,token, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?, 'active',?, NOW(), NOW())`,
        [
          adminRow[0].phone,
          adminRow[0].email,
          "Admin@123",
          first_name || "Admin",
          last_name || "User",
          gender || "male",
          dob || "2000-01-01",
          state || 0,
          city || 0,
          address || "Default",
          pincode || "000000",
          "/images/faces-clipart/profile.png",
		religion,
		 sub_religion,
		 profession,
          token || " ",
        ]
      );

      return res.status(201).json({
        
        message: "First user created from admin table. Please try registering again.",
        userId: result.insertId,
      });
    }

    // 🔹 VALIDATIONS (reuse your helpers)
    if (!first_name || !isValidName(first_name))
      return res.json({  message: "Invalid or missing first name" });
    if (!last_name || !isValidName(last_name))
      return res.json({  message: "Invalid or missing last name" });
    if (!gender || !isValidGender(gender))
      return res.json({  message: "Invalid gender" });
    if (!dob) return res.json({  message: "Date of birth required" });
    if (!isValidDobFormat(dob))
      return res.json({  message: "Invalid DOB format (YYYY-MM-DD)" });
    if (!isAdult(dob))
      return res.json({  message: "User must be at least 18 years old" });
    if (!email || !isValidEmail(email))
      return res.json({  message: "Invalid email address" });
    if (!mobile_no || !isValidPhone(mobile_no))
      return res.json({  message: "Invalid mobile number" });

    if (!state) return res.json({  message: "State is required" });
    if (!city) return res.json({  message: "City is required" });
    if (!address) return res.json({  message: "Address is required" });
    if (!pincode) return res.json({  message: "Pincode is required" });

    // 🔹 DUPLICATE CHECKS
    const [checkMobile] = await pool.query("SELECT id FROM users WHERE mobile_no = ?", [mobile_no]);
    if (checkMobile.length > 0)
      return res.json({  message: "Mobile number already exists" });

    const [checkEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (checkEmail.length > 0)
      return res.json({  message: "Email already exists" });

    // 🔹 Handle Image (Base64 or normal path)
    let imagePath = "/images/faces-clipart/profile.png";
    if (img && img.startsWith("data:image")) {
      const base64Data = img.split(";base64,").pop();
      const filename = `user_profile_${Date.now()}.png`;
      const uploadDir = "./public/images/users";
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(`${uploadDir}/${filename}`, base64Data, { encoding: "base64" });
      imagePath = `/images/users/${filename}`;
    }

    // 🔹 INSERT NEW USER
    const [insertResult] = await pool.query(
      `INSERT INTO users 
      (mobile_no, email, password, first_name, last_name, gender, dob, state, city, address, pincode, img,religion,sub_religion,
 profession, status,token, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,? ,'active',?, ?, ?)`,
      [
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
        imagePath,
		religion,
		 sub_religion,
		 profession,
        token,
        created_at,
        created_at,
      ]
    );

    const newUserId = insertResult.insertId;

    return res.status(201).json({
      message: "User registered successfully",
      userId: newUserId,
      img: imagePath,
    });
  } catch (err) {
    console.error("Register User Error:", err);
    return res
      .status(500)
      .json({  message: "Server error. Please try again.",err: err });
  }
};


export const registerUseradmin1 = async (req, res) => {
  const { username, name, gender, dob, phone, email, password,interests } = req.body;
//console.log(req.body);
const profile_pic= '/images/faces-clipart/profile.png';
const cover_pic= '/images/faces-clipart/cover.png';
    // Convert interests array to JSON string
    const interestsString = JSON.stringify(interests || []);
  // 🔹 Validations
  if (!username) return res.status(200).json({ message: "Username is required" });
  if (!name) return res.status(200).json({  message: "Name is required" });
  if (!isValidName(name)) return res.status(200).json({  message: "Name must contain only letters and spaces" });
  if (!gender) return res.status(200).json({  message: "Gender is required" });
  if (!isValidGender(gender)) return res.status(200).json({  message: "Invalid Gender - male, female, or other" });
  if (!dob) return res.status(200).json({  message: "Date of birth is required" });
  if (!isValidDobFormat(dob)) return res.status(200).json({ message: "Please enter valid dob in YYYY-MM-DD format" });
  if (!isAdult(dob)) return res.status(200).json({  message: "User must be at least 18 years old" });
  // if (!phone) return res.status(200).json({ success: false, message: "Phone is required" });
if (phone && !isValidPhone(phone)) {
  return res.status(200).json({  message: "Invalid Phone format" });
}
  if (!email) return res.status(200).json({ message: "Email is required" });
  if (!isValidEmail(email)) return res.status(200).json({  message: "Invalid email format" });
  if (!password) return res.status(200).json({  message: "Password is required" });

  try {

    // 🔹 Check username exists
if (username) {
  const [existingUsername] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
  if (existingUsername.length > 0) {
    return res.status(200).json({  message: "Username already registered" });
  }
}

// 🔹 Check email exists
if (email) {
  const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existingEmail.length > 0) {
    return res.status(200).json({ message: "Email already registered" });
  }
}

// 🔹 Check phone exists (optional field)
if (phone) {
  const [existingPhone] = await pool.query("SELECT id FROM users WHERE phone = ?", [phone]);
  if (existingPhone.length > 0) {
    return res.status(200).json({  message: "Phone number already registered" });
  }
}


    // 🔹 Insert new user (password stored as plain text)
    const [result] = await pool.query(
      "INSERT INTO users (username, name, gender, dob, phone, email, password,interests,profile_pic,cover_pic) VALUES (?, ?, ?, ?, ?, ?, ?,?, ?,?)",
      [username, name, gender, dob, phone, email, password, interestsString,profile_pic,cover_pic]
    );

    const newUserId = result.insertId;

    // ✅ Final response
    return res.json({
      success: true,
      message: "User registered successfully",
      userId: newUserId
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({  message: "Server error" });
  }
};
export const registerUser1 = async (req, res) => {
  const {  username, name, gender, dob, phone, email, password,interests , token } = req.body;
  //console.log(req.body);
const profile_pic= '/images/faces-clipart/profile.png';
const cover_pic= '/images/faces-clipart/cover.png';

 const interestsString = JSON.stringify(interests || []);
  // 🔹 Validations
  if (!username) return res.status(200).json({  message: "Username is required" });
  if (!name) return res.status(200).json({ message: "Name is required" });
  if (!isValidName(name)) return res.status(200).json({  message: "Name must contain only letters and spaces" });
  if (!gender) return res.status(200).json({  message: "Gender is required" });
  if (!isValidGender(gender)) return res.status(200).json({  message: "Invalid Gender - male, female, or other" });
  if (!dob) return res.status(200).json({ message: "Date of birth is required" });
  if (!isValidDobFormat(dob)) return res.status(200).json({ message: "Please enter valid dob in YYYY-MM-DD format" });
  if (!isAdult(dob)) return res.status(200).json({  message: "User must be at least 18 years old" });
  if (!phone) return res.status(200).json({  message: "Phone is required" });
  if (!isValidPhone(phone)) return res.status(200).json({  message: "Invalid Phone format" });
  if (!email) return res.status(200).json({  message: "Email is required" });
  if (!isValidEmail(email)) return res.status(200).json({  message: "Invalid email format" });
  if (!password) return res.status(200).json({  message: "Password is required" });
  if (!token) return res.status(200).json({  message: "Token is required" });

  try {
    // 🔹 Check if phone, email or username already exists
// 🔹 Check username exists
if (username) {
  const [existingUsername] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
  if (existingUsername.length > 0) {
    return res.status(200).json({ message: "Username already registered" });
  }
}

// 🔹 Check email exists
if (email) {
  const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existingEmail.length > 0) {
    return res.status(200).json({ message: "Email already registered" });
  }
}

// 🔹 Check phone exists (optional field)
if (phone) {
  const [existingPhone] = await pool.query("SELECT id FROM users WHERE phone = ?", [phone]);
  if (existingPhone.length > 0) {
    return res.status(200).json({ success: false, message: "Phone number already registered" });
  }
}


    // 🔹 Insert new user (password stored as plain text)
    const [result] = await pool.query(
      "INSERT INTO users (username, name, gender, dob, phone, email, password,interests,profile_pic,cover_pic,token) VALUES (?, ?, ?, ?, ?, ?, ?,?, ?,?,?)",
      [username, name, gender, dob, phone, email, password, interestsString,profile_pic,cover_pic,token]
    );

    const newUserId = result.insertId;

    // ✅ Final response
    return res.json({
      message: "User registered successfully",
      userId: newUserId,
      token: token
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({  message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Step 1: Check for missing fields
  if (!email) {
    return res.status(200).json({
      success: false,
      message: "Email is required",
    });
  }

  if (!password) {
    return res.status(200).json({
      success: false,
      message: "Password is required",
    });
  }
  
    // 🔹 Email validation
  if (email && !isValidEmail(email)) {
    return res.status(200).json({ success: false, message: "Invalid email format" });
  }

  // 🔹 Password validation
  if (password && !isValidPassword(password)) {
    return res.status(200).json({
      success: false,
      message: "Password must be 8+ chars, include 1 uppercase, 1 number, 1 special char",
    });
  }
  if (!token) return res.status(200).json({ success: false, message: "Token is required" });
  try {
    // Step 2: Email से user निकालो
    const query = "SELECT * FROM users WHERE email = ?";
    const [rows] = await pool.query(query, [email]);

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "User not found",
        userId: null,
      });
    }

    const user = rows[0];

    // Step 3: Plain password compare करो
    if (password !== user.password) {
      return res.status(200).json({
        success: false,
        message: "Incorrect password"
      });
    }

    // Step 4: Token create करो
    const token = createToken(user);

    res.json({
      success: true,
      message: "Login successful",
      userId: user.id
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(200).json({
      success: false,
      message: "Server error",
    });
  }
};


//-------------------new postman status code api --------------------------------------------
export const loginUserVerify = async (req, res) => {
  const { email, phone, password, token } = req.body;

  if (!token)
    return res.status(400).json({ message: "Token is required" });

  if (!email && !phone)
    return res.status(400).json({ 
      message: "Phone or Email is required", 
      userId: null 
    });

  try {
    let query, value;

    if (email) {
      query = "SELECT * FROM users WHERE email = ?";
      value = email;
    } else {
      query = "SELECT * FROM users WHERE mobile_no = ?";
      value = phone;
    }

    const [rows] = await pool.query(query, [value]);

    if (rows.length === 0)
      return res.status(404).json({  
        message: "User not found", 
        userId: null 
      });

    const user = rows[0];

    // If email login, check password
  /* if (email) {
      if (!password) {
        return res.status(400).json({
          message: "Password is required",
          userId: null
        });
      }

      if (user.password !== password) {
        return res.status(401).json({
          message: "Invalid credentials",
          userId: null
        });
      }
    }*/

    // Check inactive user
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Your profile is blocked",
        userId: null
      });
    }

    // Update token in DB
    await pool.query("UPDATE users SET token = ? WHERE id = ?", [token, user.id]);

    res.status(200).json({
      message: "Login successful",
      userId: user.id,
      token: token
    });

  } catch (err) {
    console.error("❌ loginUserVerify error:", err);
    res.status(503).json({ 
      message: err, 
      userId: null 
    });
  }
};


