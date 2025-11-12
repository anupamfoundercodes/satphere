import express from "express";
import { findfriendlist,searchfriendlist} from "../controllers/matchController.js";

const router = express.Router();
router.post("/findfriendlist",findfriendlist);
router.post("/searchfriendlist",searchfriendlist);
export default router;
