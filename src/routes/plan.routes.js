import express from "express";
import { planlist,userPayments,updateUserAdsCount,userPlanUpdate} from "../controllers/planController.js";

const router = express.Router();
router.post("/planlist",planlist);

router.post("/userplans",userPayments);

router.post("/useradscount", updateUserAdsCount);

router.post("/userPlanUpdate", userPlanUpdate);

export default router;