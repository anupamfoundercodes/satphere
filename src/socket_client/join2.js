import { io } from "socket.io-client";

const socket = io("https://pookichat.merabharatmeraration.com");

socket.on("connect", () => {
  console.log("🟢 Connected as User 2");
  socket.emit("join", { userId: 2 });
});

socket.on("matched", (data) => {
  console.log("🎯 Matched:", data);
});
