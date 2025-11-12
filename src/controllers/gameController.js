import { pool } from "../config/db.js";

// 🕹️ JOIN GAME
export const joinGame = async (req, res) => {
  try {
    const { user_id, game_id } = req.body;

    const [game] = await pool.query("SELECT * FROM games WHERE id=? AND status='active'", [game_id]);
    if (!game.length) return res.status(404).json({ message: "Game not found or inactive" });

    const entryFee = game[0].entry_fee;

    const [wallet] = await pool.query("SELECT * FROM wallet WHERE user_id=?", [user_id]);
    if (!wallet.length) return res.status(404).json({ message: "Wallet not found" });

    if (wallet[0].coins < entryFee) {
      return res.status(400).json({ message: "Insufficient coins" });
    }

    // Deduct entry fee
    const newCoins = wallet[0].coins - entryFee;
    await pool.query("UPDATE wallet SET coins=? WHERE user_id=?", [newCoins, user_id]);

    // Add game history
    await pool.query(
      "INSERT INTO game_history (user_id, game_id, entry_fee, result) VALUES (?,?,?,'joined')",
      [user_id, game_id, entryFee]
    );

    res.json({
      success: true,
      message: "Game joined successfully",
      coins_left: newCoins,
    });
  } catch (err) {
    console.error("Join Game Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🏆 GAME WON
export const gameWon = async (req, res) => {
  try {
    const { user_id, game_id } = req.body;

    const [game] = await pool.query("SELECT * FROM games WHERE id=?", [game_id]);
    if (!game.length) return res.status(404).json({ message: "Game not found" });

    const reward = game[0].reward;

    const [wallet] = await pool.query("SELECT * FROM wallet WHERE user_id=?", [user_id]);
    if (!wallet.length) return res.status(404).json({ message: "Wallet not found" });

    const newCoins = wallet[0].coins + reward;
    await pool.query("UPDATE wallet SET coins=? WHERE user_id=?", [newCoins, user_id]);

    await pool.query(
      "UPDATE game_history SET result='won', reward=? WHERE user_id=? AND game_id=? ORDER BY id DESC LIMIT 1",
      [reward, user_id, game_id]
    );

    res.json({
      success: true,
      message: "Game marked as won",
      reward,
      total_coins: newCoins,
    });
  } catch (err) {
    console.error("Game Won Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📜 GAME HISTORY
export const gameHistory = async (req, res) => {
  try {
    const { user_id } = req.params;
    const [history] = await pool.query(
      `SELECT gh.*, g.title 
       FROM game_history gh
       JOIN games g ON gh.game_id = g.id
       WHERE gh.user_id = ?
       ORDER BY gh.created_at DESC`,
      [user_id]
    );

    res.json({
      success: true,
      history,
    });
  } catch (err) {
    console.error("Game History Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
