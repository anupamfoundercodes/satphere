// src/routes/list.routes.js
import express from "express";
import { getStatesLinks,getDistrictByState,getSubReligionByReligion,getBanners,getProfessionalList,getPersonalList,getFemilyList} from "../controllers/listController.js";

const router = express.Router();

// GET /api/social-links
router.get("/stateList", getStatesLinks);
router.get("/Banners", getBanners);
router.post("/getCitiesByState", getDistrictByState);
router.post("/getSubReligion", getSubReligionByReligion);
router.get("/getProfessionalList", getProfessionalList);
router.get("/getPersonalList", getPersonalList);
router.get("/getFemilyList", getFemilyList);
export default router;
