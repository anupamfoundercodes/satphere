import express from "express";
import { referrals,incrementTotalInvites} from "../controllers/refferalController.js";

const router = express.Router();
router.post("/referrals",referrals);

router.post('/totalinvites', incrementTotalInvites);

export default router;