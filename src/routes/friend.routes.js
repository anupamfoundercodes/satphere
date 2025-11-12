import express from "express";
import { friendlist,manageFriend,recentlist,updateReport,friendlistChat} from "../controllers/friendController.js";

const router = express.Router();
router.post("/listfriend",friendlist);

router.post("/managefriend",manageFriend);

router.post("/recentlist",recentlist);

router.post("/userReport",updateReport);

router.post("/friendListChat",friendlistChat);
export default router;
