import express from "express";
import { getNotifications, userSendNotification,userCountRead,deleteNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/getnotifications/:user_id", getNotifications);
router.post("/sendusernotification", userSendNotification);
router.put("/updatecountnotification", userCountRead);
// 🗑️ Delete Notification
router.delete("/deleteNotification", deleteNotification);

export default router;
