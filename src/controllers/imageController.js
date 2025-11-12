import { pool } from "../config/db.js";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import multer from "multer";

// ====== SETUP IMAGE DIRECTORY ======
const IMAGE_DIR = path.join(process.cwd(), "userimage");
if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

// ====== MULTER CONFIG ======
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGE_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `user_${req.body.userId || "unknown"}_${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, JPEG, and PNG images allowed"));
    }
    cb(null, true);
  },
});

// =====================================================
// 1️⃣ UPLOAD MULTIPLE IMAGES (FormData)
// body: userId, images[] (files)
// =====================================================
export const uploadUserImages = async (req, res) => {
  try {
    const { userId } = req.body;
    const files = req.files;

    if (!userId)
      return res.status(400).json({ success: false, message: "userId is required" });
    if (!files || files.length === 0)
      return res.status(400).json({ success: false, message: "No images uploaded" });

    for (const file of files) {
      await pool.query(
        "INSERT INTO user_images (user_id, image, status) VALUES (?, ?, 'ACTIVE')",
        [userId, `/userimage/${file.filename}`]
      );
    }

    return res.json({ success: true, message: "Images uploaded successfully" });
  } catch (err) {
    console.error("Upload Images Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// 2️⃣ GET USER IMAGES (ACTIVE by default)
// params: :userId
// query: status=ALL|ACTIVE|INACTIVE
// =====================================================
export const getUserImages = async (req, res) => {
  const { userId } = req.params;
  const { status = "ACTIVE" } = req.query;

  if (!userId)
    return res.status(400).json({ success: false, message: "User ID is required" });

  const where = status === "ALL" ? "user_id = ?" : "user_id = ? AND status = ?";
  const values = status === "ALL" ? [userId] : [userId, status];

  try {
    const [rows] = await pool.query(
      `SELECT id, image, status, created_at FROM user_images WHERE ${where} ORDER BY id DESC`,
      values
    );

    const baseUrl = process.env.APP_URL || "";
    const withUrl = rows.map((r) => ({
      ...r,
      image: `${baseUrl}${r.image}`,
    }));

    return res.json({ success: true, images: withUrl });
  } catch (err) {
    console.error("Get User Images Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// 3️⃣ REPLACE ONE IMAGE (FormData)
// body: imageId, image (file)
// =====================================================
export const editUserImage = async (req, res) => {
  try {
    const { imageId } = req.body;
    const file = req.file;

    if (!imageId)
      return res.status(400).json({ success: false, message: "imageId is required" });
    if (!file)
      return res.status(400).json({ success: false, message: "New image file is required" });

    const [rows] = await pool.query("SELECT user_id, image FROM user_images WHERE id = ?", [imageId]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Image not found" });

    const old = rows[0];
    const oldPath = path.join(IMAGE_DIR, path.basename(old.image));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

    await pool.query(
      "UPDATE user_images SET image = ?, status = 'ACTIVE' WHERE id = ?",
      [`/userimage/${file.filename}`, imageId]
    );

    return res.json({
      success: true,
      message: "Image replaced successfully",
      fileName: `/userimage/${file.filename}`,
    });
  } catch (err) {
    console.error("Edit User Image Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================================================
// 4️⃣ DELETE ONE IMAGE (physical file + DB row)
// body: imageId
// =====================================================
export const deleteUserImage = async (req, res) => {
  const { imageId } = req.body;

  if (!imageId)
    return res.status(400).json({ success: false, message: "imageId is required" });

  try {
    const [rows] = await pool.query("SELECT image FROM user_images WHERE id = ?", [imageId]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Image not found" });

    const filePath = path.join(IMAGE_DIR, path.basename(rows[0].image));
    if (fs.existsSync(filePath)) await fsp.unlink(filePath).catch(() => {});

    await pool.query("DELETE FROM user_images WHERE id = ?", [imageId]);

    return res.json({ success: true, message: "Image deleted" });
  } catch (err) {
    console.error("Delete User Image Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
