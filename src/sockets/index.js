import { pool } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

let users = {}; // { socketId: { userId, online, channelName } }

export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);
    
    // ✅ User joins system
socket.on("join", async ({ userId ,gender}) => {
  console.log("🟢 join running for:", userId);
console.log("Gender:", gender);
  // Step 1: Save user in memory
//   users[socket.id] = { userId, online: 1, channelName: null };
// Step 1: Save user in memory (with gender)
users[socket.id] = { userId, online: 1, channelName: null, gender };

  await updateUserOnline(userId, 1);

  // Step 2: Find another available user (status = 1 and not same user)
//   const availableUser = Object.entries(users).find(([sid, u]) => {
//     return sid !== socket.id && u.online === 1 && u.channelName === null;
//   });

  // Step 2: Find another available user
  const availableUser = Object.entries(users).find(([sid, u]) => {
    if (sid === socket.id || u.online !== 1 || u.channelName !== null) return false;

    if (gender === "male") {
      return u.gender === "male";
    } else if (gender === "female") {
      return u.gender === "female";
    } else {
      return true; // random pick (anything/null/others)
    }
  });

  if (availableUser) {
    const [partnerSocketId, partner] = availableUser;

    // Create unique channelName
    const channelName = `room_${uuidv4()}`;

    // Update both users
    users[socket.id].channelName = channelName;
    users[socket.id].online = 2;

    users[partnerSocketId].channelName = channelName;
    users[partnerSocketId].online = 2;

    await updateUserOnline(userId, 2);
    await updateUserOnline(partner.userId, 2);

    // Step 3: Notify both users
    io.to(socket.id).emit("matched", {
      channelName,
      partnerId: partner.userId
    });

    io.to(partnerSocketId).emit("matched", {
      channelName,
      partnerId: userId
    });

    console.log(`✅ Matched: ${userId} ↔ ${partner.userId} in ${channelName}`);
  } else {
    // No partner found yet
    io.to(socket.id).emit("waiting", { message: "Waiting for a partner..." });
  }
});

// ✅ Start Call (upgrade to active call + save history)
socket.on("startCall", async () => {
  try {
    if (!users[socket.id]) return;
    const { userId, channelName } = users[socket.id];
    if (!channelName) {
      console.log("❌ No channel found for user:", userId);
      return;
    }
    
    

    // partner find karo (same channelName, but not me)
    const partnerSocketId = Object.keys(users).find(
      sid => users[sid].channelName === channelName && sid !== socket.id
    );
    if (!partnerSocketId) {
      console.log("❌ Partner not found for channel:", channelName);
      return;
    }
    const partnerId = users[partnerSocketId].userId;

    // update memory
    users[socket.id].online = 3;
    users[partnerSocketId].online = 3;

    // update DB
    await updateUserOnline(userId, 3, channelName);
    await updateUserOnline(partnerId, 3, channelName);

    // save match history
    await saveMatch(userId, partnerId, channelName);

    // notify dono ko
    io.to(socket.id).emit("callStarted", {
      channelName,
      partnerId
    });
    io.to(partnerSocketId).emit("callStarted", {
      channelName,
      partnerId: userId
    });

    console.log(`📞 Call started: ${userId} ↔ ${partnerId} in ${channelName}`);
  } catch (err) {
    console.error("startCall error:", err);
  }
});


// ✅ End Call Event
socket.on("endCall", async ({ userId, peerId }) => {
  try {
    console.log(`📞 End Call by user: ${userId}, peer: ${peerId}`);

    // dono users ko searching par bhej do (online = 1)
    await updateUserOnline(userId, 1);
    await updateUserOnline(peerId, 1);

    // users object me bhi update
    if (users[socket.id]) {
      users[socket.id].online = 1;
    }

    // peerId ke socket ko dhundo aur uska bhi online 1 karo
    const peerSocketId = Object.keys(users).find(
      (id) => users[id].userId === peerId
    );
    if (peerSocketId && users[peerSocketId]) {
      users[peerSocketId].online = 1;
      io.to(peerSocketId).emit("status", { online: 1 });
    }

    // apne socket ko bhi emit
    io.to(socket.id).emit("status", { online: 1 });

    console.log("✅ Both users set to searching mode (online=1)");
  } catch (error) {
    console.error("❌ Error in endCall:", error);
  }
});

// ✅ Disconnect Event
socket.on("disconnect", async () => {
  try {
    const user = users[socket.id];
    if (user) {
      console.log(`🔴 User disconnected: ${user.userId}`);

      // sirf us user ka online = 0
      await updateUserOnline(user.userId, 0);

      // remove from users list
      delete users[socket.id];
    }
  } catch (error) {
    console.error("❌ Error in disconnect:", error);
  }
});

  });
}


// async function pickRandomAvailable(excludeUserId) {
//     console.log("excludeUserId",excludeUserId)
//   const [rows] = await pool.query(
//     "SELECT * FROM users WHERE online=1 AND id<>? ORDER BY RAND() LIMIT 1",
//     [excludeUserId]
//   );
//   console.log(rows)
//   return rows[0] || null;
// }

async function pickRandomAvailable(excludeUserId, gender) {
  try {
    console.log("excludeUserId:", excludeUserId, "gender:", gender);

    let query = "SELECT * FROM users WHERE online = 1 AND id <> ?";
    let params = [excludeUserId];

    // gender filter lagao
    if (gender === "male") {
      query += " AND gender = 'male'";
    } else if (gender === "female") {
      query += " AND gender = 'female'";
    } 
    // agar gender 'other' ya null/empty hai to filter mat lagao → random se pick hoga

    query += " ORDER BY RAND() LIMIT 1";

    const [rows] = await pool.query(query, params);
    console.log("picked user:", rows);
    return rows[0] || null;
  } catch (err) {
    console.error("Error in pickRandomAvailable:", err);
    return null;
  }
}



// 🔹 Update users table
async function updateUserOnline(userId, online, channelName = null) {
  try {
    const [rows] = await pool.query(
      "UPDATE users SET online = ?, channel_name = ? WHERE id = ?",
      [online, channelName, userId]
    );
    console.log(`✅ DB updated for user ${userId}: online=${online}, channel=${channelName}`);
    return rows;
  } catch (err) {
    console.error("DB Error updateUserOnline:", err);
  }
}

// 🔹 Save match
async function saveMatch(userA, userB, channelName) {
    
//   if (!channelName || !userA) {
//       console.log("User or channelName can not null ");
//     return res.status(400).json({ error: "channelName and userId required" });
//   }
if (!channelName || !userA) {
  console.log("uerId or channelName missing in saveMatch");
  return;
}

  try {
    await pool.query(
      `INSERT INTO matches 
       (user_a, user_b, channel_name, status, started_at, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [userA, userB, channelName, "active"]
    );
    console.log(`✅ Match saved: ${userA} <-> ${userB} in ${channelName}`);
  } catch (err) {
    console.error("DB Error saveMatch:", err);
  }
}
