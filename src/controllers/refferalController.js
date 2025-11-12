import { pool } from "../config/db.js";

export const referrals = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: "user_id is required",
        data: []
      });
    }

    // ---- Get referral data ----
    const [referralRows] = await pool.query(
      `SELECT code, total_invited, joined, rewards, available 
       FROM referrals 
       WHERE user_id = ? LIMIT 1`,
      [user_id]
    );

    if (referralRows.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Referral code not found for this user",
        data: []
      });
    }

    const referral = referralRows[0];

    // ---- Get referral invites with username ----
    const [inviteRows] = await pool.query(
      `SELECT ri.id, ri.invited_user_id, u.name,
              DATE(ri.created_at) AS created_at
       FROM referral_invites ri
       JOIN users u ON ri.invited_user_id = u.id
       WHERE ri.ref_code = ?
       ORDER BY ri.created_at DESC`,
      [referral.code]
    );

    return res.status(200).json({
      success: true,
      message: "Referrals data fetched successfully",
      count: referral.total_invited,
      referral_code: referral.code,
      joined: referral.joined,
      available: referral.available,
      rewards: referral.rewards,
      referral_list: inviteRows
    });
  } catch (err) {
    console.error("Error fetching referrals:", err.message);
    return res.status(200).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};


export const incrementTotalInvites = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: "user_id is required"
      });
    }

    // Increment total_invited by 1
    const [result] = await pool.query(
      `UPDATE referrals 
       SET total_invited = total_invited + 1 
       WHERE user_id = ?`,
      [user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(200).json({
        success: false,
        message: "User referral not found"
      });
    }

    // Fetch updated total_invited
    const [referralRows] = await pool.query(
      `SELECT total_invited FROM referrals WHERE user_id = ? LIMIT 1`,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      message: "Total invites incremented successfully",
      total_invited: referralRows[0].total_invited
    });

  } catch (err) {
    console.error("Error incrementing total_invites:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

