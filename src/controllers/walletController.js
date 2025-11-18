import { pool } from "../config/db.js";


export const userTransactions = async (req, res) => {
  try {
    const { user_id, type } = req.body;

    if (!user_id) {
      return res.status(400).json({
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
      message: rows.length ? "User transactions fetched" : "No transactions found",
      data: rows
    });

  } catch (err) {
    console.error("User Transactions Error:", err);
    return res.status(500).json({
      success: err,
      message: "Server error",
      data: []
    });
  }
};

