import express from "express";
import { userWallet,userTransactions} from "../controllers/walletController.js";

const router = express.Router();
router.post("/userWallet",userWallet);

router.post("/userTransactions",userTransactions);

export default router;