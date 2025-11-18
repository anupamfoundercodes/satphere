import express from "express";
import {userTransactions} from "../controllers/walletController.js";

const router = express.Router();

router.post("/userTransactions",userTransactions);

export default router;