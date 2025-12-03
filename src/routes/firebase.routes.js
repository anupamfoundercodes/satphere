// firebase.routes.js
import express from "express";
import admin from "firebase-admin";
import { pool } from "../config/db.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import serviceAccount from "../serviceAccountKey.json" assert { type: "json" };
import moment from "moment-timezone";

const created_at = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Firebase initialize only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}


// await admin.messaging().subscribeToTopic(userToken, "news");
// token subscribeToTopic code 
/* ------------------ 
   📌 Function: Insert Notification in DB
------------------ */


async function insertNotification(user_id, title, message, senderid,type) {
  if (!user_id || !title || !message) {
    throw new Error("Missing required fields (user_id, title, message,type)");
  }

  const query = `
    INSERT INTO notifications (user_id, title, message, is_read, senderid,type,created_at) 
    VALUES (?, ?, ?, 0, ?,?,?)
  `;
console.log(  created_at);
  const [result] = await pool.query(query, [
    user_id,
    title,
    message,
    senderid || null,
    type ||null,
    created_at,
  ]);

  console.log("✅ Notification inserted, ID:", result.insertId);
  return result;
}

router.post("/callingNotifications", async (req, res) => {
  const { token, title, message, data, user_id, sender_id, type, channel } = req.body;
  console.log("calling notification", req.body);

  if (!token || !title || !message || !user_id || !type) {
    return res.status(400).json({
     
      message: "Token, title, message, and user_id, type are required",
    });
  }

  // ✅ Added this part
  const [rows] = await pool.query(
    "SELECT img,first_name, token AS otherToken FROM users WHERE id = ? LIMIT 1",
    [sender_id]
  );
  let profile_pic = "";
  let otherToken = "";
  let first_name = "";
  if (rows.length > 0 && rows[0].img) {
    const baseURL = process.env.APP_URL || "https://root..satphere.com/";
    profile_pic = `${baseURL}${rows[0].img}`;
    otherToken = rows[0].otherToken || "";
  }
console.log("profile_pic: ",profile_pic);
console.log("otherToken: ",otherToken);
  // ✅ Keep your existing payload logic
  const payload = {
    notification: { title, body: message },
    token,
    data: {
      type: String(type),
      channel: String(channel),
      profile_pic: String(profile_pic || ""),
      otherToken: String(otherToken || ""),
      first_name: String(first_name || "")
    }
  };

  try {
    await insertNotification(user_id, title, message, sender_id,type);
    console.log("✅ Notification saved in DB");

    const response = await admin.messaging().send(payload);
    res.json({
      message: "Notification sent successfully",
      response,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(503).json({
      message: "Failed to send notification",
      error: err.message,
    });
  }
});
router.post("/callingNotificationsok", async (req, res) => {
  const { token, title, message, data, user_id, sender_id, type, channel } = req.body;
  console.log("calling notification", req.body);

  if (!token || !title || !message || !user_id || !type) {
    return res.status(400).json({
      message: "Token, title, message, and user_id, type are required",
    });
  }

  // ✅ Added this part
  const [rows] = await pool.query(
    "SELECT img FROM users WHERE id = ? LIMIT 1",
    [sender_id]
  );
  let profile_pic = "";
  if (rows.length > 0 && rows[0].img) {
    const baseURL = process.env.APP_URL || "https://yourdomain.com/";
    profile_pic = `${baseURL}${rows[0].img}`;
  }
console.log("profile_pic: ",profile_pic);
  // ✅ Keep your existing payload logic
  const payload = {
    notification: { title, body: message },
    token,
    data: {
      type: String(type),
      channel: String(channel),
      profile_pic: String(profile_pic || "")
    }
  };

  try {
    await insertNotification(user_id, title, message, sender_id,type);
    console.log("✅ Notification saved in DB");

    const response = await admin.messaging().send(payload);
    res.json({
      message: "Notification sent successfully",
      response,
      payload,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: err.message,
    });
  }
});


// 📌 Single notification
router.post("/sendnotifications", async (req, res) => {
  const { token, title, message, data, user_id, sender_id ,type} = req.body;

  if (!token || !title || !message || !user_id) {
    return res
      .status(400)
      .json({
        message: "Token, title, message, and user_id are required",
      });
  }

  const payload = {
    notification: { title, body: message },
    token,
    data: data || {},
  };

  try {
    await insertNotification(user_id, title, message, sender_id ,type);
    console.log("✅ Notification saved in DB");

    const response = await admin.messaging().send(payload);
    res.json({
      message: "Notification sent successfully",
      response,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(503).json({
      message: "Failed to send notification",
      error: err.message,
    });
  }
});

// 📌 Test route
router.get("/sendnotificationss", async (req, res) => {
  const fcmToken = req.query.token;
  if (!fcmToken) {
    return res.status(400).send("FCM token is required");
  }

  const message = {
    notification: {
      title: "Hello from Node.js",
      body: "This is a Firebase push notification!",
    },
    token: fcmToken,
    data: { customKey: "customValue" },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Successfully sent push message:", response);
    res.send(`Notification sent: ${response}`);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(200).send("Failed to send notification");
  }
});

//  Multiple notifications
router.post("/sendmultiplenotifications", async (req, res) => {
  const { token, title, message } = req.body;

  if (!token || !Array.isArray(token) || token.length === 0 || !title || !message) {
    return res
      .status(200)
      .json({ success: false, message: "Tokens, title, and message are required" });
  }

  const notification = {
    notification: { title, body: message },
  };

  let successCount = 0;
  let failureCount = 0;
  let errors = [];

  for (const tkn of token) {
    try {
      await admin.messaging().send({ ...notification, token: tkn });
      successCount++;
    } catch (err) {
      console.error(`❌ Failed to send notification to ${tkn}:`, err.message);
      errors.push({ token: tkn, error: err.message });
      failureCount++;
    }
  }

  return res.status(200).json({
    success: true,
    message: `Notifications sent: ${successCount} succeeded, ${failureCount} failed`,
    errors,
  });
});

router.post('/sendTopicNotification', async (req, res) => {
  const { title, message, type, sender_id} = req.body;
   const topic = process.env.TOPIC
  if (!topic || !title || !message) {
    return res.status(400).json({ success: false, message: 'Topic, title, and message are required' });
  }

  try {
    // . DB Insert (Optional - अगर सभी पर log चाहिए)
    //await insertNotification(null, title, message,  sender_id||null,type);
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, senderid,type, is_read, created_at) 
         VALUES (?, ?, ?, ?,?, ?, ?)`,
        [0, title, message, 0,type, 0, new Date()]
      );
    // Topic पर Notification भेजो
    await admin.messaging().send({
      notification: { title, body: message },
      topic: topic
    });

    return res.status(200).json({
      success: true,
      message: `Notification sent Successfully: ${topic}`
    });

  } catch (err) {
    console.error(`❌ Failed for topic ${topic}:`, err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send topic notification',
      error: err.message
    });
  }
});



export default router;
