// src/routes/socket.routes.js
import { Router } from "express";

const router = Router();

router.get("/socket-status", (req, res) => {
  const connectedClients = global.io ? global.io.engine.clientsCount : 0;

  res.json({
    success: true,
    message: "Socket server is running",
    connectedClients,
  });
});

export default router;
