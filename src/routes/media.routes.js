import express from "express";
import { getRandomUserVideos ,likeVideo,getComments,addComment} from "../controllers/mediaController.js"; // 👈 adjust the path if needed

const router = express.Router();

// 🎥 Get random videos
router.post("/randomVideos", getRandomUserVideos);
router.post("/likeVideo", likeVideo);
router.post("/getComments", getComments);
router.post("/addComment", addComment);



export default router;
