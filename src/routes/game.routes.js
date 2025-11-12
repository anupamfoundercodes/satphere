import express from "express";
import { joinGame, gameWon, gameHistory } from "../controllers/gameController.js";

const router = express.Router();

router.post("/gameJoin", joinGame);       // Join Game
router.post("/gameWon", gameWon);         // Win Game
router.get("/gameHistory/:user_id", gameHistory); // Game History

export default router;
