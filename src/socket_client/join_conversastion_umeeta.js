// install if not done yet
// npm install socket.io-client

// const { io } = require("socket.io-client");
import { io } from "socket.io-client";
// connect to your socket.io server
const socket = io("http://3.129.126.163:8000", {
  transports: ["websocket"],   // force websocket (optional)
});

// connection success
socket.on("connect", () => {
  console.log("✅ Connected with socket id:", socket.id);

  // Example: join a one-to-one conversation
  socket.emit("join_conversation", {
    userId: "114",          // current user id
    otherUserId: "6",     // opponent user id
    is_group: 0            // 0 = one-to-one, 1 = group
  });

  // Example: join a group conversation
  // socket.emit("join_conversation", {
  //   userId: "112",
  //   otherUserId: "group_123", // group id
  //   is_group: 1
  // });
});

// listen for chat history from server
socket.on("history", (messages) => {
  console.log("📜 Chat History Received:", messages);
});

// listen for errors
socket.on("error_message", (msg) => {
  console.error("❌ Error:", msg);
});

// disconnection
socket.on("disconnect", () => {
  console.log("⚠️ Disconnected from server");
});
