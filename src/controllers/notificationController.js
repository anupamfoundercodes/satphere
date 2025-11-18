import { pool } from "../config/db.js";
import moment from "moment-timezone";

const created_at = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  // ✅ Use APP_URL from .env
const BASE_URL = process.env.APP_URL; 
export const getNotifications = async (req, res) => {
  const { user_id } = req.params;

  try {
    // Notifications fetch
    const [rows] = await pool.query(
      `
      SELECT 
        t.id,
        t.user_id,
        t.title,
        t.message,
        t.is_read,
        t.created_at,
        t.senderid,
        t.status,
        t.type,
        u.img,
        CASE 
          WHEN t.senderid = 0 THEN 'Admin'
          ELSE u.first_name
        END AS sender_name
      FROM notifications t
      LEFT JOIN users u ON t.senderid = u.id
      WHERE t.user_id = ? OR (t.user_id = 0 AND t.created_at >= NOW() - INTERVAL 7 DAY)
      ORDER BY t.created_at DESC, t.id DESC
      `,
      [user_id]
    );

    if (!rows || rows.length === 0) {
      return res.json({
        message: "No data found",
        count: 0,
        data: []
      });
    }

    // ✅ Step 1: Get max notification_id user has read
    const [readResult] = await pool.query(
      `SELECT MAX(notification_id) AS last_read_id 
       FROM notification_read 
       WHERE user_id = ?`,
      [user_id]
    );

    const lastReadId = readResult[0]?.last_read_id || 0;

    // ✅ Step 2: Count unread (only those > lastReadId)
    const [countResult] = await pool.query(
      `
      SELECT COUNT(*) AS unread_count
      FROM notifications n
      WHERE (n.user_id = ? OR n.user_id = 0)
      AND n.id > ?
      `,
      [user_id, lastReadId]
    );

    const unreadCount = countResult[0]?.unread_count || 0;
    const dataWithFullURL = rows.map((row) => ({
  ...row,
  img: row.img ? `${BASE_URL}/${row.img}` : null
}));

    res.json({  
      message: "Notification Get Successfully",
      count: unreadCount,
      data: dataWithFullURL 
    });
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ success: false, message: "Server error", count: 0, data: [] });
  }
};
//-------------------------------------------------------------------------------

// ✅ users Send Notification API
export const userSendNotification = async (req, res) => {
  const { user_id, title, message, senderid } = req.body;

  if (!user_id || !title || !message || !senderid) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, title, message, senderid,created_at) VALUES (?, ?, ?, ?,?)`,
      [user_id, title, message, senderid,created_at]
    );

    return res.status(200).json({
      msg: "Notification sent successfully",
      notification_id: result.insertId
    });

  } catch (err) {
    console.error("❌ User Send Notification Error:", err);
    return res.status(500).json({  message: "Server error" });
  }
};
//------------------------------------------------------------------------------
export const userCountRead = async (req, res) => {
  const { user_id, notification_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "Please enter user_id" });
  }
  if (!notification_id) {
    return res.status(400).json({  message: "Please enter notification_id" });
  }

  try {
    // ✅ Check if exact user_id + notification_id already exists
    const [exactResult] = await pool.query(
      `SELECT * FROM notification_read WHERE user_id = ? AND notification_id = ?`,
      [user_id, notification_id]
    );

    if (exactResult.length > 0) {
      return res.status(200).json({ message: "Notification already marked as read" });
    }

    // ✅ Check if user_id exists with any notification_id
    const [userResult] = await pool.query(
      `SELECT * FROM notification_read WHERE user_id = ?`,
      [user_id]
    );

    if (userResult.length > 0) {
      // Update that row with new notification_id
      await pool.query(
        `UPDATE notification_read SET notification_id = ?, read_at = NOW() WHERE user_id = ?`,
        [notification_id, user_id]
      );
      return res.status(200).json({  message: "Notification updated as read" });
    } else {
      // Insert new row
      await pool.query(
        `INSERT INTO notification_read (user_id, notification_id, read_at) VALUES (?, ?, NOW())`,
        [user_id, notification_id]
      );
      return res.status(200).json({  message: "Notification inserted as read" });
    }
  } catch (err) {
    console.error("❌ Error in userCountRead:", err);
    return res.status(500).json({ message: "Database error while marking as read" });
  }
};



// 🧹 Delete Notification API
export const deleteNotification = async (req, res) => {
  const { user_id, notification_id } = req.body;

  if (!user_id || !notification_id) {
    return res.status(400).json({
      message: "user_id and notification_id are required",
    });
  }

  try {
    // Check if notification exists and belongs to user
    const [rows] = await pool.query(
      "SELECT id FROM notifications WHERE id = ? AND user_id = ?",
      [notification_id, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "This Notification Delete By Admin",
      });
    }

    // Delete notification
    await pool.query("DELETE FROM notifications WHERE id = ? AND user_id = ?", [
      notification_id,
      user_id,
    ]);

    return res.json({
      message: "Notification deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete Notification Error:", err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


