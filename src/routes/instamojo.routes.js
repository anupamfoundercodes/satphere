import express from "express";
import bodyParser from "body-parser";
import Insta from "instamojo-nodejs";
import { createManualPayment , submitPayment} from "../controllers/instamojoController.js";

const router = express.Router();

router.post("/manualpay", createManualPayment);

router.post("/paymentsubmit", submitPayment);

export default router;
