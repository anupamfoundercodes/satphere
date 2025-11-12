// install if not already
// npm install socket.io-client

import { io } from "socket.io-client";

// Connect to your Python Socket.IO server
const socket = io("http://3.129.126.163:8000", {
  transports: ["websocket"],  // force WebSocket
  reconnection: true,
  reconnectionDelay: 2000,
  timeout: 20000
});

// When connected
socket.on("connect", () => {
  console.log("✅ Connected to server with id:", socket.id);

  // Send a comment_chat event
//   {'userid': '114', 'chat_id': 'd7e33348-d3cd-44d3-af2b-10482ac318ad', 'group_id': '969624827', 'type': '2', 'comment': 'jjjjj', 'view_type': '1'}
  socket.emit("comment_chat", {
    userid: "114",
    chat_id: "d7e33348-d3cd-44d3-af2b-10482ac318ad",
    group_id: "290534974",
    type: 2,                  // 1=>Like, 2=>Comment, 3=>Emoji
    comment: "Hello, this is my comment!",
    view_type: "1"
  });
});

// Listen for server response (receive_comment)
socket.on("receive_comment", (data) => {
  console.log("📩 Received comments:", JSON.stringify(data, null, 2));
});

// Listen for errors
socket.on("error_message", (err) => {
  console.error("❌ Error:", err);
});

// Handle disconnect
socket.on("disconnect", () => {
  console.log("⚠️ Disconnected from server");
});
