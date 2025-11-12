import { Server } from "socket.io";
import { pool } from "../config/db.js"; // aapke pool wala file
import { v4 as uuidv4 } from "uuid";

let users = {}; // { socketId: { userId, online, channelName } }
export default function testSocket(io) {
  io.on("connection", (socket) => {
    console.log("🟢 Test socket connected:", socket.id);

    // Har 1 second me time bhejna
   socket.on("join1", async ({ userId }) => {
  console.log("join running for userId:", userId);

  users[socket.id] = { userId, online: 1, channelName: null };

  const result = await updateUserOnline(userId, 1);
  console.log("DB Update Result:", result);

  io.to(socket.id).emit("status", { online: 1 });
});

    // Hello event - client se msg receive kare
    socket.on("hello", (msg) => {
      console.log(`📨 Hello event received:`, msg);
      // Client ko bhi response bhej do
      socket.emit("helloResponse", { received: msg });
    });
    // console.log("🟢 Test socket connected:ertrytrytry", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 Test socket disconnected:", socket.id);
   //   clearInterval(interval);
    });
  });
}

// 🔹 Update users table → online column & channel_name
async function updateUserOnline(userId, online, channelName = null) {
  try {
    const [rows] = await pool.query(
      "UPDATE users SET online = ?, channel_name = ? WHERE id = ?",
      [online, channelName, userId]
    );
    return rows;
  } catch (err) {
    console.error("DB Error updateUserOnline:", err);
  }
}