import express from "express";
import { updateProfile,updateProfessional ,updateLifestyle ,updatePersonalDetails ,getProfile,updateOnlineStatus,updateUserLocation,getProfileother ,updateLiveStatus,updatEarning,updateInterestStatus} from "../controllers/userController.js";

const router = express.Router();

// POST /api/useredit
router.put("/useredit", updateProfile);
router.put("/updateProfessional", updateProfessional);
router.put("/updateLifestyle", updateLifestyle);
router.put("/updatePersonalDetails", updatePersonalDetails);

router.get("/userget/:userId", getProfile);

router.get("/getProfileOthers/:userId", getProfileother);

// router.get("/userget1/:userId", getProfile1);
// Update Online Status
router.post("/onlineStatus", updateOnlineStatus);

router.post("/liveStatus", updateLiveStatus);

router.post("/enableEarning", updatEarning);
// GET /api/users/test
router.get("/test", (req, res) => {
  res.json({ success: true, message: "User API is working 🚀" });
});

// Only add if this route doesn't exist yet
router.post("/updatelocation", updateUserLocation);

router.patch("/updateInterestStatus", updateInterestStatus);

export default router;
