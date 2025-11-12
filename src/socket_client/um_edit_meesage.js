const { io } = require("socket.io-client");

// 🔗 Connect to your Socket.IO server
const socket = io("http://3.129.126.163:8000", {
  transports: ["websocket"], // force websocket for stability
});

// ✅ On connect
socket.on("connect", () => {
  console.log("✅ Connected to server with ID:", socket.id);

  // Example payload for editing a message
  const editPayload = {
    conversation_id: "112_114",       // one-to-one chat
    group_id: null,                    // or "grp_456" for group chat
    message_id: "0604cbc9-98b0-4c1c-9166-b1468bc8d112", // existing UUID
    sender_id: "112",
    new_text: "Updated message from Node.js client",
    new_image_urls: [],
    opponent_id: "114",
    created_time: new Date().toISOString(),
  };

  // 🚀 Emit edit_message event
  socket.emit("edit_message", editPayload);
});

// 📩 Listen for server confirmation
socket.on("message_edited", (data) => {
  console.log("✅ Message Edited Event Received:", data);
});

// ⚠️ Listen for errors
socket.on("error_message", (err) => {
  console.error("❌ Error:", err);
});

// ❌ On disconnect
socket.on("disconnect", () => {
  console.log("🔌 Disconnected from server");
});
