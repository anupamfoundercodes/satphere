import { io } from "socket.io-client";

const socket = io("https://pookichat.merabharatmeraration.com");

socket.on("connect", () => {
  console.log("🟢 Connected as User 1");
  socket.emit("join", { userId: 1 });
});

socket.on("matched", (data) => {
  console.log("🎯 Matched:", data);
});
