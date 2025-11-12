import express from "express";
import {
  uploadUserImages,
  getUserImages,
  editUserImage,
  deleteUserImage,
  upload, // from multer config in controller
} from "../controllers/imageController.js";

const router = express.Router();

// ✅ Multiple file upload (FormData → images[])
router.post("/uploadUserImages", upload.array("images", 10), uploadUserImages);

// ✅ Replace/Edit one image (FormData → image)
router.put("/editUserImage", upload.single("image"), editUserImage);

// ✅ Optional PUT route alias for update
router.put("/imageupdate", upload.single("image"), editUserImage);

// ✅ Delete one image
router.delete("/imagedelete", deleteUserImage);

// ✅ Get images by userId
router.get("/getUserImages/:userId", getUserImages);

export default router;
