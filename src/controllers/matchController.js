import { pool } from "../config/db.js";

const BASE_URL = process.env.APP_URL;

// 🔹 Helper function – Calculate distance between two lat/lon (in km)
function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(2);
}

// 🔹 API: findfriendlist (with pagination)
export const findfriendlist = async (req, res) => {
  try {
    const { user_id, page = 1, limit = 10 } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
        data: [],
      });
    }

    const offset = (page - 1) * limit;

    // 1️⃣ Get current user's details
    const [userRows] = await pool.query(
      "SELECT gender FROM users WHERE id = ?",
      [user_id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: [],
      });
    }

    const userGender = userRows[0].gender;
    const oppositeGender = userGender === "male" ? "female" : "male";

    // 2️⃣ Get all related users (already in friend list)
    const [relatedRows] = await pool.query(
      `SELECT friend_id AS uid FROM friends WHERE user_id = ? AND type IN (0,1,3)
       UNION
       SELECT user_id AS uid FROM friends WHERE friend_id = ? AND type IN (1,3)`,
      [user_id, user_id]
    );

    const excludedIds = relatedRows.map((r) => r.uid);
    excludedIds.push(parseInt(user_id)); // exclude self

    // 3️⃣ Count total opposite-gender users excluding related ones
    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM users
      WHERE gender = ?
        AND id NOT IN (?)
        AND status = 'active'
      `,
      [oppositeGender, excludedIds.length ? excludedIds : [0]]
    );

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    // 4️⃣ Fetch paginated results
    const [rows] = await pool.query(
      `
      SELECT 
        u.id AS profile_id,
        u.first_name,
        u.last_name,
        u.gender,
        u.dob,
        u.img,
        u.religion,
        u.sub_religion,
        u.profession,
        u.state,
        u.city,
        u.address,
        u.token
      FROM users u
      WHERE u.gender = ?
        AND u.id NOT IN (?)
        AND u.status = 'active'
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [oppositeGender, excludedIds.length ? excludedIds : [0], Number(limit), Number(offset)]
    );

    // 5️⃣ Format result
    const data = rows.map((r) => ({
      profile_id: r.profile_id,
      first_name: r.first_name,
      last_name: r.last_name,
      gender: r.gender,
      dob: r.dob,
      img: r.img ? BASE_URL + r.img : null,
      religion: r.religion,
      sub_religion: r.sub_religion,
      profession: r.profession,
      state: r.state,
      city: r.city,
      address: r.address,
      token: r.token,
    }));

    return res.status(200).json({
      success: true,
      message: data.length
        ? "Opposite-gender users fetched successfully"
        : "No users found",
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
      data,
    });
  } catch (err) {
    console.error("Friend List API Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: [],
    });
  }
};

export const searchfriendlist = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
        data: [],
      });
    }

    // 1️⃣ Get current user's gender
    const [userRows] = await pool.query(
      "SELECT gender FROM users WHERE id = ?",
      [user_id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: [],
      });
    }

    const userGender = userRows[0].gender;
    const oppositeGender = userGender === "male" ? "female" : "male";

    // 2️⃣ Get all related users (already in friend list)
    const [relatedRows] = await pool.query(
      `SELECT friend_id AS uid FROM friends WHERE user_id = ? AND type IN (0,1,3)
       UNION
       SELECT user_id AS uid FROM friends WHERE friend_id = ? AND type IN (1,3)`,
      [user_id, user_id]
    );

    const excludedIds = relatedRows.map((r) => r.uid);
    excludedIds.push(parseInt(user_id)); // exclude self

    // 3️⃣ Fetch all opposite-gender users excluding related ones
    const [rows] = await pool.query(
      `
      SELECT 
        u.id AS profile_id,
        u.first_name,
        u.last_name,
        u.gender,
        u.dob,
        u.img,
        u.religion,
        u.sub_religion,
        u.profession,
        u.state,
        u.city,
        u.address,
        u.token
      FROM users u
      WHERE u.gender = ?
        AND u.id NOT IN (?)
        AND u.status = 'active'
      ORDER BY u.created_at DESC
      `,
      [oppositeGender, excludedIds.length ? excludedIds : [0]]
    );

    // 4️⃣ Format result
    const data = rows.map((r) => ({
      profile_id: r.profile_id,
      first_name: r.first_name,
      last_name: r.last_name,
      gender: r.gender,
      dob: r.dob,
      img: r.img ? BASE_URL + r.img : null,
      religion: r.religion,
      sub_religion: r.sub_religion,
      profession: r.profession,
      state: r.state,
      city: r.city,
      address: r.address,
      token: r.token,
    }));

    return res.status(200).json({
      success: true,
      message: data.length
        ? "Opposite-gender users fetched successfully"
        : "No users found",
      total: data.length,
      data,
    });
  } catch (err) {
    console.error("Friend List API Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: [],
    });
  }
};


// 🔹 API: findfriendlist
// export const findfriendlist = async (req, res) => {
//   try {
//     const { user_id } = req.body;

//     if (!user_id) {
//       return res.status(200).json({
//         success: false,
//         message: "user_id is required",
//         data: [],
//       });
//     }

//     // 1️⃣ Get current user's details
//     const [userRows] = await pool.query(
//       "SELECT gender, latitude, longitude FROM users WHERE id = ?",
//       [user_id]
//     );

//     if (userRows.length === 0) {
//       return res
//         .status(200)
//         .json({ success: false, message: "User not found", data: [] });
//     }

//     const user = userRows[0];
//     const userGender = user.gender;
//     const userLat = parseFloat(user.latitude);
//     const userLon = parseFloat(user.longitude);

//     const oppositeGender = userGender === "male" ? "female" : "male";

//     // 2️⃣ Get all related users (already in friend list)
//     const [relatedRows] = await pool.query(
//       `SELECT friend_id AS uid FROM friends WHERE user_id = ?
//        UNION 
//        SELECT user_id AS uid FROM friends WHERE friend_id = ?`,
//       [user_id, user_id]
//     );

//     const excludedIds = relatedRows.map((r) => r.uid);
//     excludedIds.push(parseInt(user_id)); // exclude self

//     // 3️⃣ Fetch opposite-gender users excluding related ones
//     const [rows] = await pool.query(
//       `
//       SELECT 
//         u.id AS profile_id,
//         u.username,
//         u.name,
//         u.profile_pic,
//         u.latitude,
//         u.longitude
//       FROM users u
//       WHERE u.gender = ?
//         AND u.id NOT IN (?)
//         AND u.status = 'active'
//         AND u.latitude IS NOT NULL
//         AND u.longitude IS NOT NULL
//       `,
//       [oppositeGender, excludedIds.length ? excludedIds : [0]]
//     );

//     // 4️⃣ Add full URL + distance calculation
//     const data = rows.map((r) => {
//       const lat2 = parseFloat(r.latitude);
//       const lon2 = parseFloat(r.longitude);
//       const distance = userLat && userLon ? getDistanceFromLatLon(userLat, userLon, lat2, lon2) : null;

//       return {
//         profile_id: r.profile_id,
//         username: r.username,
//         name: r.name,
//         profile_pic: r.profile_pic ? BASE_URL + r.profile_pic : null,
//         distance_km: distance ? `${distance} km` : "Unknown",
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       message: data.length
//         ? "Opposite-gender users fetched successfully"
//         : "No users found",
//       data,
//     });
//   } catch (err) {
//     console.error("Friend List API Error:", err);
//     return res.status(200).json({
//       success: false,
//       message: "Server error",
//       data: [],
//     });
//   }
// };
