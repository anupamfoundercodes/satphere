import express from "express";
const app = express();
app.use(express.json()); 
import pkg from "agora-access-token";   // 👈 CommonJS ko import karna ka sahi tareeka
const { RtcTokenBuilder, RtcRole } = pkg;


const router = express.Router();

// 🔑 Replace with your Agora App ID & Certificate
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

// In-memory store (production me DB use karo)
const channelHosts = new Map();

// Generate Token Endpoint

router.post("/generate-token", (req, res) => {
  const { channelName, user_id } = req.body;

  if (!channelName || !user_id) {
    return res.status(400).json({ message: "channelName and user_id required" });
  }

  // Expiration time (1 hour)
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Determine role
  let role;
  let isHost = false;

  if (!channelHosts.has(channelName)) {
    // First user → host
    channelHosts.set(channelName, user_id);
    role = RtcRole.PUBLISHER;
    isHost = true;
  } else {
    // All others → audience
    role = RtcRole.SUBSCRIBER;
  }

  // Build Agora token
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    user_id,
    role,
    privilegeExpiredTs
  );

  return res.json({
    message: "Token generated successfully",
    token,
    isHost,
    hostId: channelHosts.get(channelName),
    channelName,
  });
});
router.post("/generate-token2", (req, res) => {
//   const channelName = req.query.channelName;
//   const userId = req.query.userId;
const{channelName,userId}= req.body;
  console.log(channelName);

  if (!channelName || !userId) {
    return res.status(400).json({ message: "channelName and userId required" });
  }

  // Get role
  const role =
    req.query.role === "audience" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

  // First user in channel = host
  if (!channelHosts.has(channelName)) {
    channelHosts.set(channelName, userId);
  }

  const isHost = channelHosts.get(channelName) === userId;

  // Expiration time (1 hour)
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Build token
  const token = RtcTokenBuilder.buildTokenWithUid(
    // APP_ID,
    // APP_CERTIFICATE,
        AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    userId,
    role,
    privilegeExpiredTs
  );

  return res.json({
      message:"Token ganrated sucessfully",
    token,
    isHost,
    hostId: channelHosts.get(channelName),
    channelName:channelName,
  });
});
router.get("/generate-token1", (req, res) => {
  const channelName = req.query.channelName;
  const userId = req.query.userId;
  console.log(channelName);

  if (!channelName || !userId) {
    return res.status(400).json({ message: "channelName and userId required" });
  }

  // Get role
  const role =
    req.query.role === "audience" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

  // First user in channel = host
  if (!channelHosts.has(channelName)) {
    channelHosts.set(channelName, userId);
  }

  const isHost = channelHosts.get(channelName) === userId;

  // Expiration time (1 hour)
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Build token
  const token = RtcTokenBuilder.buildTokenWithUid(
    // APP_ID,
    // APP_CERTIFICATE,
        AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    userId,
    role,
    privilegeExpiredTs
  );

  return res.json({
      message:"Token ganrated sucessfully",
    token,
    isHost,
    hostId: channelHosts.get(channelName),
  });
});
export default router;


