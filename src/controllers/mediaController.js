import cloudinary from "../config/cloudinary.js";
import { pool } from "../config/db.js";
import dotenv from "dotenv";
import moment from "moment-timezone";

const created_at = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");


dotenv.config(); // load .env file


export const getRandomUserVideos = async (req, res) => {
  try {
    const { user_id, limit = 10, offset = 0 } = req.body; // client provides user_id, limit, offset

    if (!user_id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const baseURL = (process.env.APP_URL || "https://dating.codescarts.com").replace(/\/$/, "");

    // Fetch random videos with user info and like status
    const [rows] = await pool.query(
      `SELECT 
          uv.*, 
          u.username, 
          u.earning_status,
          CASE 
            WHEN u.profile_pic IS NOT NULL AND u.profile_pic != '' 
            THEN CONCAT(?, u.profile_pic)
            ELSE CONCAT(?, '/images/faces-clipart/profile.png')
          END AS profile_pic,
          CASE 
            WHEN vl.type = 'like' THEN 1
            ELSE 0
          END AS is_liked
       FROM user_videos uv
       JOIN users u ON uv.user_id = u.id
       LEFT JOIN video_likes vl ON vl.video_id = uv.id AND vl.user_id = ?
       WHERE uv.status = 'ACTIVE'
       ORDER BY RAND()
       LIMIT ? OFFSET ?`,
      [baseURL, baseURL, user_id, parseInt(limit), parseInt(offset)]
    );

    return res.json({
      success: true,
      message: "Random videos fetched successfully",
      data: rows,
    });
  } catch (err) {
    console.error("Get Random Videos Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const likeVideo = async (req, res) => {
  try {
    const { user_id, video_id, type } = req.body; // type = 'like' or 'dislike'
    if (!user_id || !video_id || !type) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }

    // 1️⃣ Check if user already liked/disliked this video
    const [existing] = await pool.query(
      `SELECT type FROM video_likes WHERE user_id = ? AND video_id = ?`,
      [user_id, video_id]
    );

    let likeIncrement = 0; // how much to update like_count

    if (existing.length === 0) {
      // First time like/dislike
      likeIncrement = type === 'like' ? 1 : 0; // only increment if 'like'
      await pool.query(
        `INSERT INTO video_likes (user_id, video_id, type) VALUES (?, ?, ?)`,
        [user_id, video_id, type]
      );
    } else {
      // Already exists
      const prevType = existing[0].type;

      if (prevType === type) {
        // same type, do nothing
        return res.json({ success: true, message: `Video already ${type}d` });
      }

      // Change type, adjust like_count
      if (prevType === 'like' && type === 'dislike') {
        likeIncrement = -1;
      } else if (prevType === 'dislike' && type === 'like') {
        likeIncrement = 1;
      }

      await pool.query(
        `UPDATE video_likes SET type = ? WHERE user_id = ? AND video_id = ?`,
        [type, user_id, video_id]
      );
    }

    // 2️⃣ Update like_count in user_videos
    if (likeIncrement !== 0) {
      await pool.query(
        `UPDATE user_videos SET like_count = like_count + ? WHERE id = ?`,
        [likeIncrement, video_id]
      );
    }

    return res.json({ success: true, message: `Video ${type}d successfully` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getComments = async (req, res) => {
  try {
    const { video_id } = req.body;
    if (!video_id) {
      return res.status(400).json({ success: false, message: "Video ID is required" });
    }

    // Fetch parent comments
    const [comments] = await pool.query(
      `SELECT vc.*, u.username,
              CASE 
                WHEN u.profile_pic IS NOT NULL AND u.profile_pic != '' 
                THEN CONCAT(?, u.profile_pic)
                ELSE CONCAT(?, '/images/faces-clipart/profile.png')
              END AS profile_pic
       FROM video_comments vc
       JOIN users u ON vc.user_id = u.id
       WHERE vc.video_id = ? AND vc.is_reply = 0 AND vc.status = 'ACTIVE'
       ORDER BY vc.created_at DESC`,
      [process.env.APP_URL, process.env.APP_URL, video_id]
    );

    // Fetch replies for each comment
    for (let comment of comments) {
      const [replies] = await pool.query(
        `SELECT vc.*, u.username,
                CASE 
                  WHEN u.profile_pic IS NOT NULL AND u.profile_pic != '' 
                  THEN CONCAT(?, u.profile_pic)
                  ELSE CONCAT(?, '/images/faces-clipart/profile.png')
                END AS profile_pic
         FROM video_comments vc
         JOIN users u ON vc.user_id = u.id
         WHERE vc.comment_id = ? AND vc.status = 'ACTIVE'
         ORDER BY vc.created_at ASC`,
        [process.env.APP_URL, process.env.APP_URL, comment.id]
      );
      comment.replies = replies;
    }

    return res.json({ success: true, message: "Comments fetched successfully", data: comments });
  } catch (err) {
    console.error("Get Comments Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
// Add a comment or reply
export const addComment = async (req, res) => {
  try {
    let { user_id, video_id, description, is_reply = 0, comment_id} = req.body;

    if (!user_id || !video_id || !description) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }
    
        if (comment_id == 0) {
          comment_id = null;
        }

    // Insert comment
    const [insert] = await pool.query(
      `INSERT INTO video_comments (video_id, user_id, description, is_reply, comment_id,created_at) 
       VALUES (?, ?, ?, ?, ?,?)`,
      [video_id, user_id, description, is_reply, comment_id,created_at]
    );

    return res.json({ success: true, message: "Comment added successfully", comment_id: insert.insertId });
  } catch (err) {
    console.error("Add Comment Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
