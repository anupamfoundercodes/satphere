import { pool } from "../config/db.js";

// ✅ Get or Create Wallet for a User
export const userWallet = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: "user_id is required",
      });
    }

    // 1️⃣ Check if wallet exists
    const [existing] = await pool.query(
      "SELECT * FROM wallet WHERE user_id = ?",
      [user_id]
    );

    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Wallet fetched successfully",
        data: existing[0],
      });
    }

    // 2️⃣ If not found — create new wallet
    const [insert] = await pool.query(
      "INSERT INTO wallet (user_id, balance, coins, status) VALUES (?, 0.00, 0, 'active')",
      [user_id]
    );

    const [newWallet] = await pool.query(
      "SELECT * FROM wallet WHERE id = ?",
      [insert.insertId]
    );

    return res.status(200).json({
      success: true,
      message: "New wallet created successfully",
      data: newWallet[0],
    });
  } catch (error) {
    console.error("Error in userWallet:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const userTransactions = async (req, res) => {
  try {
    const { user_id, type } = req.body;

    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: "user_id is required",
        data: []
      });
    }

    // Base query
    let query = `
      SELECT 
        p.id,
        p.user_id,
        p.plan_id,
        pl.name AS plan_name,
        p.order_id,
        p.payment_id,
        p.signature,
        p.amount,
        p.currency,
        p.type,
        p.status,
        p.gateway_type,
        p.created_at,
        p.expire_at
      FROM payments p
      LEFT JOIN plans pl ON p.plan_id = pl.id
      WHERE p.user_id = ?
    `;

    const params = [user_id];

    // Add type filter if provided
    if (type && ['credit', 'debit'].includes(type)) {
      query += " AND p.type = ?";
      params.push(type);
    }

    // Order by newest first
    query += " ORDER BY p.created_at DESC";

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: rows.length ? "User transactions fetched" : "No transactions found",
      data: rows
    });

  } catch (err) {
    console.error("User Transactions Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: []
    });
  }
};

