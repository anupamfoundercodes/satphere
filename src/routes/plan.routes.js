import express from "express";
import { planlist,getPlansFaq, userPayments,updateUserAdsCount,userPlanUpdate} from "../controllers/planController.js";

const router = express.Router();
router.post("/planlist",planlist);

router.get("/getPlansFaq",getPlansFaq);

router.post("/userplans",userPayments);

router.post("/useradscount", updateUserAdsCount);

router.post("/userPlanUpdate", userPlanUpdate);

export default router;