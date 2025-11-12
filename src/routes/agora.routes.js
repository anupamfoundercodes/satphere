import express from "express";
const app = express();
app.use(express.json()); 
import pkg from "agora-access-token";   // 👈 CommonJS ko import karna ka sahi tareeka
const { RtcTokenBuilder, RtcRole } = pkg;



// import express from "express";
// import { RtcTokenBuilder, RtcRole } from "agora-access-token";

const router = express.Router();

// 🔑 Replace with your Agora App ID & Certificate
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

// In-memory store (production me DB use karo)
const channelHosts = new Map();

// const APP_ID = "4bd666f239cb4b83a4fdb878f4fe763";
// const APP_CERTIFICATE = "62dd525074e64422b83f6c996fbca47";

// Generate Token Endpoint

router.post("/generate-token", (req, res) => {
  const { channelName, userId } = req.body;

  if (!channelName || !userId) {
    return res.status(400).json({ error: "channelName and userId required" });
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
    channelHosts.set(channelName, userId);
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
    userId,
    role,
    privilegeExpiredTs
  );

  return res.json({
    success: true,
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
    return res.status(400).json({ error: "channelName and userId required" });
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
      success:true,
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
    return res.status(400).json({ error: "channelName and userId required" });
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
      success:true,
      message:"Token ganrated sucessfully",
    token,
    isHost,
    hostId: channelHosts.get(channelName),
  });
});
export default router;


// API Endpoint to generate token
// router.post("/generateToken", (req, res) => {
//   const {channelName,uid }= req.body;
//   if (!channelName) {
//     return res.status(200).json({ error: "channelName is required" });
//   }
//   if (!uid) {
//     return res.status(200).json({ error: "uid is required" });
//   }

//   // UID (user id) - agar pass na kare to 0 rakh do
//   //const uid = req.query.uid ? parseInt(req.query.uid) : 0;

//   // Role (Broadcaster/Publisher)
//   const role = RtcRole.PUBLISHER;

//   // Expiration time (1 hour)
//   const expirationTimeInSeconds = 3600;
//   const currentTimestamp = Math.floor(Date.now() / 1000);
//   const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

//   // Generate token
//   const token = RtcTokenBuilder.buildTokenWithUid(
//     APP_ID,
//     APP_CERTIFICATE,
//     channelName,
//     uid,
//     role,
//     privilegeExpiredTs
//   );
// console.log("APP_ID",APP_ID);
// console.log("APP_CERTIFICATE",APP_CERTIFICATE);
//   return res.json({
//     channelName,
//     uid,
//     token,
//     expiredAt: privilegeExpiredTs,
//   });
// });

// export default router;
