// import dotenv from "dotenv";
// dotenv.config();
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import http from "http";
import { Server } from "socket.io";
import initSocket from "./sockets/index.js";
import testSocket from "./sockets/test.js";
import app from "./app.js";
import './cron/dailyCoins.js';

const PORT = process.env.PORT || 2027;
// const HOST = '13.201.200.211'; // aapka server IP

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
global.io = io; // 👈 ye line add karo

// ✅ Initialize socket events from socket/index.js
initSocket(io);
// testSocket(io);
// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });
app.get("/time-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const interval = setInterval(() => {
    const currentTime = new Date().toLocaleString();
    res.write(`data: ${currentTime}\n\n`);
  }, 1000);

  req.on("close", () => {
    clearInterval(interval);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on https://root.satphere.com`);
});