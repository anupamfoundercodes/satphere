import { pool } from "../config/db.js";

const BASE_URL = (process.env.APP_URL || "").replace(/\/$/, "");

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

// ✅ MANAGE FRIEND API
export const manageFriend = async (req, res) => {
  try {
    let { user_id, friend_id, type } = req.body;
    const reqType = parseInt(type);

    console.log("Incoming Request:", { user_id, friend_id, type });

    // ------------------- Validation -------------------
    if (!user_id || user_id === "null" || user_id === "undefined") {
      return res.status(400).json({  message: "Please enter user_id" });
    }
    if (!friend_id || friend_id === "null" || friend_id === "undefined") {
      return res.status(400).json({  message: "Please enter friend_id" });
    }
    if (isNaN(reqType)) {
      return res.status(400).json({  message: "type is required" });
    }

    // ------------------- Messages Map -------------------
    const messages = {
      0: { created: "Friend request sent successfully", exists: "Friend request already sent" },
      1: { created: "Friend request accepted successfully", exists: "Friend already accepted" },
      2: { created: "Friend request rejected successfully", exists: "Friend already rejected" },
      3: { created: "Friend blocked successfully", exists: "Friend already blocked" },
      4: { created: "Friend sortlist successfully", exists: "Friend already sortlist" },
      5: { created: "Friend sortlist remove successfully", exists: "Friend sortlist already remove" }
    };

    // ------------------- Check Existing Records -------------------
    const [existing] = await pool.query(
      "SELECT * FROM friends WHERE user_id=? AND friend_id=?",
      [user_id, friend_id]
    );	

    const [reverse] = await pool.query(
      "SELECT * FROM friends WHERE user_id=? AND friend_id=?",
      [friend_id, user_id]
    );

    // ------------------- Mutual Match Logic -------------------
    if (reqType === 0 && reverse.length > 0 && parseInt(reverse[0].type) === 0) {
      console.log("Mutual match detected between", user_id, "and", friend_id);

      await pool.query(
        "UPDATE friends SET type=1, status='active', updated_at=NOW() WHERE user_id=? AND friend_id=?",
        [friend_id, user_id]
      );

      if (existing.length > 0) {
        await pool.query(
          "UPDATE friends SET type=1, status='active', updated_at=NOW() WHERE user_id=? AND friend_id=?",
          [user_id, friend_id]
        );
      } else {
        await pool.query(
          "INSERT INTO friends (user_id, friend_id, type, status, created_at, updated_at) VALUES (?,?,1,'active',NOW(),NOW())",
          [user_id, friend_id]
        );
      }

      const [users] = await pool.query(
        "SELECT id, first_name, img FROM users WHERE id IN (?, ?) AND status='active'",
        [user_id, friend_id]
      );

      const userMap = {};
      users.forEach((u) => { userMap[u.id] = u; });

      const user1 = userMap[user_id];
      const user2 = userMap[friend_id];

      return res.status(200).json({
        matched: "1",
        message: "You Got The Match!",
        user1_profile_pic: user1?.img ? BASE_URL + user1.img : null,
        user2_profile_pic: user2?.img ? BASE_URL + user2.img : null
      });
    }

    // ------------------- Normal Update or Insert -------------------
    if (existing.length > 0) {
      if (parseInt(existing[0].type) === reqType) {
        return res.status(200).json({
          message: messages[reqType]?.exists || "Relation already exists",
          type: reqType
        });
      }

      await pool.query(
        "UPDATE friends SET type=?, status='active', updated_at=NOW() WHERE user_id=? AND friend_id=?",
        [reqType, user_id, friend_id]
      );

      return res.status(200).json({
        matched: "0",
        message: messages[reqType]?.created || "Friend relation updated",
        type: reqType
      });
    } else {
      await pool.query(
        "INSERT INTO friends (user_id, friend_id, type, status, created_at, updated_at) VALUES (?,?,?, 'active', NOW(), NOW())",
        [user_id, friend_id, reqType]
      );

      return res.status(200).json({
        matched: "0",
        message: messages[reqType]?.created || "Friend relation created",
        type: reqType
      });
    }
  } catch (err) {
    console.error("Manage Friend Error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "Friend request already exists"
      });
    }
    return res.status(500).json({  message: "Server error" });
  }
};


// ✅ FRIEND LIST API
export const friendlist = async (req, res) => {
  try {
    const { user_id, type } = req.body;

    // ------------------- Validation -------------------
    if (!user_id) {
      return res.status(400).json({
        message: "user_id is required",
        data: [],
      });
    }

    if (![0, 1, 2, 3, 4, "0", "1", "2", "3" ,"4"].includes(type)) {
      return res.status(400).json({
        message: "Invalid type. Use 0=request, 1=friends, 2=rejected, 3=blocked, 4=Sortlist" ,
        data: [],
      });
    }

    // ------------------- Query Conditions -------------------
    let typeCondition = "";
    let params = [user_id, user_id, user_id, user_id];

    if (type == 0) {
      // Friend Requests (pending)
	typeCondition = `
	  AND f.type = 0 
	  AND f.friend_id = ? 
	  AND NOT EXISTS (
		  SELECT 1 FROM friends f2
		  WHERE 
			((f2.user_id = f.user_id AND f2.friend_id = f.friend_id)
			OR (f2.user_id = f.friend_id AND f2.friend_id = f.user_id))
			AND f2.type = 1
	  )
	`;
	params.push(user_id);

    } else if (type == 1) {
      // Accepted Friends
      typeCondition = "AND f.type = 1";
    } else if (type == 2) {
      // Rejected
      typeCondition = "AND f.type = 2";
    } else if (type == 3) {
      // Blocked
      typeCondition = "AND f.type = 3";
    }
    else if (type == 4) {
      // Sortlist
      typeCondition = "AND f.type = 4";
    }


    // ------------------- Main Query -------------------
    const query = `
      SELECT 
          f.id AS friend_record_id,
          f.user_id,
          f.friend_id,
          f.type,
          f.status,
          u.id AS profile_id,
          u.first_name,
          u.last_name,
          u.gender,
          DATE(u.dob) AS dob,
          u.state,
          u.city,
          u.address,
          u.pincode,
          u.img,
		  u.profession,
          u.sub_religion,
         u.religion,
          u.token
      FROM friends f
      JOIN users u 
          ON ((f.user_id = ? AND u.id = f.friend_id)
            OR (f.friend_id = ? AND u.id = f.user_id))
      WHERE (f.user_id = ? OR f.friend_id = ?)
      ${typeCondition}
      AND u.status = 'active'
      ORDER BY f.updated_at DESC;
    `;

    const [rows] = await pool.query(query, params);

    // ------------------- No Data -------------------
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        message: `No records found for type ${type}`,
        data: [],
      });
    }

    // ------------------- Format Output -------------------
    const processed = rows.map((r) => {
      const img =
        r.img && r.img !== ""
          ? `${BASE_URL}${r.img}`
          : `${BASE_URL}/images/faces-clipart/profile.png`;

      return {
        ...r,
        dob: r.dob ? new Date(r.dob).toISOString().split("T")[0] : null,
        img,
      };
    });

    // ------------------- Remove Duplicates -------------------
    const uniqueFriends = [];
    const seen = new Set();
    for (const f of processed) {
      if (!seen.has(f.profile_id)) {
        seen.add(f.profile_id);
        uniqueFriends.push(f);
      }
    }

    // ------------------- Response Message -------------------
    let message = "";
    if (type == 0) message = "Friend requests fetched successfully";
    else if (type == 1) message = "Friends list fetched successfully";
    else if (type == 2) message = "Rejected list fetched successfully";
    else if (type == 3) message = "Blocked list fetched successfully";
   else if (type == 4) message = "Sortlist list fetched successfully";

    return res.status(200).json({
      message,
      count: type == 0 ? uniqueFriends.length : 0,
      data: uniqueFriends,
    });
  } catch (err) {
    console.error("❌ Friend List API Error:", err);
    return res.status(500).json({
      message: "Internal server error",
      data: [],
    });
  }
};

//users controoler logic show count in userget profile for request recived
// ----------------------------
// INTERNAL REUSABLE FUNCTION
// ----------------------------
export const friendListInternal = async (user_id, type) => {
  const fakeReq = { body: { user_id, type } };

  let output = null;

  const fakeRes = {
    status: () => fakeRes,
    json: (data) => {
      output = data; 
      return data;
    }
  };

  await friendlist(fakeReq, fakeRes);
  return output;
};


export const recentlist = async (req, res) => {
  try {
    const { user_id } = req.body;
   

    if (!user_id) {
      return res.status(200).json({
        message: "user_id is required",
        data: []
      });
    }

    const query = `
      SELECT 
        m.user_a,
        m.user_b,
        m.started_at,
        u.username,
        u.gender,
        u.location,
        u.dob,
        u.horoscope,
        u.about,
        u.mood,
        ui.image
      FROM matches m
      JOIN users u 
        ON u.id = m.user_b
      LEFT JOIN (
        SELECT user_id, image
        FROM user_images
        WHERE status = 1
        GROUP BY user_id
      ) ui 
        ON ui.user_id = m.user_b
      WHERE m.user_a = ?
      ORDER BY m.started_at DESC;
    `;

    const [rows] = await pool.query(query, [user_id]);

    if (rows.length === 0) {
      return res.status(200).json({
        message: "No recent list found",
        data: []
      });
    }

    // image path ko full URL banado
    const finalData = rows.map(r => ({
      user_a: r.user_a,
      user_b: r.user_b,
        birthday:r.dob,
        horoscope:r.horoscope,
       about: r.about,
        mood:r.mood,
      started_at: r.started_at,
      username: r.username,
      gender: r.gender,
      location: r.location,
      image: r.image ? `${BASE_URL}${r.image}` : null
    }));

    return res.status(200).json({
      message: "Recent list fetched successfully",
      data: finalData
    });

  } catch (err) {
    console.error("Recent List API Error:", err);
    return res.status(200).json({
      message: "Server error",
      data: []
    });
  }
};

// PATCH /report
export const updateReport = async (req, res) => {
  try {
    const { resion, user_a, user_b } = req.body;

    // Validation
    if (!resion || !user_a || !user_b) {
      return res.status(400).json({
        message: "resion, user_a and user_b are required"
      });
    }

    // Update query
    const query = `
      UPDATE matches 
      SET last_message = ? 
      WHERE user_a = ? AND user_b = ?
    `;

    const [result] = await pool.query(query, [resion, user_a, user_b]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "No match found for given user_a and user_b"
      });
    }

    return res.status(200).json({
      message: "Report successfully"
    });

  } catch (err) {
    console.error("Update Report API Error:", err);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const friendlistChat = async (req, res) => {
  try {
    const { user_id, type } = req.body;

    // ✅ Validation: missing user_id
    if (!user_id) {
      return res.status(400).json({
        message: "user_id is required",
        data: [],
      });
    }

    // ✅ Validation: invalid type
    if (![0, 2, 3,4, "0", "2", "3","4"].includes(type)) {
      return res.status(400).json({
        message: "type must be 0 (friends), 2 (reject), 3 (block) or 4 (SortList) ",
        data: [],
      });
    }

    let typeCondition = "";
    let params = [user_id, user_id, user_id, user_id];

    if (type == 0) {
      typeCondition = "AND f.type IN (1)";
    } else {
      typeCondition = "AND f.type = ?";
      params.push(type);
    }

    const query = `
      SELECT 
          u.id AS id,
          u.first_name,
          u.last_name,
          u.gender,
          DATE(u.dob) AS dob,
          u.state,
          u.city,
          u.address,
          u.pincode,
          u.img,
          u.token
      FROM friends f
      JOIN users u 
          ON ( (f.user_id = ? AND u.id = f.friend_id) 
            OR (f.friend_id = ? AND u.id = f.user_id) )
      WHERE (f.user_id = ?)
      ${typeCondition};
    `;

    const [rows] = await pool.query(query, params);

    // Add base URL to profile_pic
    const processed = rows.map((r) => ({
      id: r.id,
      username: r.username,
      name: r.name,
      profile_pic:
        r.profile_pic && r.profile_pic !== ""
          ? `${BASE_URL}${r.profile_pic}`
          : `${BASE_URL}/images/faces-clipart/profile.png`,
      online_status: r.online_status,
      live_status: r.live_status,
      fcm_token: r.token,
    }));

    if (processed.length === 0) {
      return res.status(200).json({
        message: `No friend list found for type ${type}`,
        data: [],
      });
    }

    // ✅ Success
    return res.status(200).json({
      message: `Friend list ${type} fetched successfully`,
      data: processed,
    });
  } catch (err) {
    console.error("Friend List Minimal API Error:", err);
    return res.status(500).json({
      message: "Server error",
      data: [],
      error: err.message,
    });
  }
};

export const chatlists = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        message: "user_id is required",
        data: [],
      });
    }

    const query = `
      SELECT 
    MIN(f.id) AS friend_record_id,
    f.type,

    CASE
      WHEN f.user_id = ? THEN f.chat
      ELSE (
        SELECT f2.chat
        FROM friends f2
        WHERE f2.user_id = ? AND f2.friend_id = f.user_id
        LIMIT 1
      )
    END AS chat,

    u.id AS profile_id,
    u.first_name,
    u.last_name,
    u.gender,
    DATE(u.dob) AS dob,
    u.state,
    u.city,
    u.address,
    u.pincode,
    u.img,
    u.profession,
    u.sub_religion,
    u.religion

FROM friends f
JOIN users u
  ON u.id = CASE
    WHEN f.user_id = ? THEN f.friend_id
    ELSE f.user_id
  END

WHERE
  (
    (f.user_id = ? AND f.chat = 1)
    OR
    (f.friend_id = ? AND f.chat = 1)
  )
  AND u.status = 'active'

GROUP BY u.id
ORDER BY MAX(f.updated_at) DESC;

    `;

    const [rows] = await pool.query(query, [
      user_id, // CASE f.user_id = ?
      user_id, // subquery f2.user_id
      user_id, // JOIN CASE
      user_id, // WHERE f.user_id
      user_id, // WHERE f.friend_id
    ]);

    if (!rows.length) {
      return res.status(200).json({
        message: "No chat list found",
        data: [],
      });
    }

    const data = rows.map((r) => {
      const img =
        r.img && r.img !== ""
          ? `${BASE_URL}${r.img}`
          : `${BASE_URL}/images/faces-clipart/profile.png`;

      return {
        friend_record_id: r.friend_record_id,
        profile_id: r.profile_id,
        first_name: r.first_name,
        last_name: r.last_name,
        gender: r.gender,
        dob: r.dob ? new Date(r.dob).toISOString().split("T")[0] : null,
        state: r.state,
        city: r.city,
        address: r.address,
        pincode: r.pincode,
        profession: r.profession,
        religion: r.religion,
        sub_religion: r.sub_religion,
        img,
        chat: r.chat, // 🔥 49 ko 1, 48 ko 0
        type: r.type,
      };
    });

    return res.status(200).json({
      message: "Chat list fetched successfully",
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("❌ Chat List API Error:", err);
    return res.status(500).json({
      message: "Internal server error",
      data: [],
    });
  }
};

export const startChat = async (req, res) => {
  try {
    const { user_id, friend_id } = req.body;

    // ---------------- Validation ----------------
    if (!user_id || !friend_id) {
      return res.status(400).json({
        message: "user_id and friend_id are required",
      });
    }

    // ---------------- Check existing row ----------------
    const checkQuery = `
      SELECT id, chat 
      FROM friends 
      WHERE user_id = ? AND friend_id = ? AND status = 'active'
      LIMIT 1
    `;

    const [existing] = await pool.query(checkQuery, [
      user_id,
      friend_id,
    ]);

    if (!existing.length) {
      return res.status(404).json({
        message: "Friend record not found",
      });
    }

    // ---------------- Already started ----------------
    if (existing[0].chat == 1) {
      return res.status(200).json({
        message: "Chat already started",
      });
    }

    // ---------------- Update chat = 1 ----------------
    const updateQuery = `
      UPDATE friends
      SET chat = 1, updated_at = NOW()
      WHERE user_id = ? AND friend_id = ?
    `;

    await pool.query(updateQuery, [user_id, friend_id]);

    return res.status(200).json({
      message: "Chat started successfully",
    });

  } catch (err) {
    console.error("❌ Start Chat Error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};




