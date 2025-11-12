import express from "express";
import { getHoroscopes, getList} from "../controllers/horoscopeController.js";

const router = express.Router();
router.get("/horoscopes", getHoroscopes);

// GET /api/list?type=1 OR /api/list?type=2
router.get("/list", getList);

export default router;
